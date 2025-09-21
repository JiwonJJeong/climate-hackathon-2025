// server.js
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const stream = require("stream");
const fs = require("fs");
const path = require("path");
const zipcodes = require("zipcodes");
const axios = require("axios");
const { spawn } = require("child_process");
const { insertCsvRows, insertApiData, runQuery } = require("./db");
const cors = require("cors");

const app = express();
app.use(express.json()); // <-- add this


const upload = multer({ storage: multer.memoryStorage() });
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}));

const CACHE_FILE = path.join(__dirname, "weather_cache.json");

// ------------------
// Cache helpers
// ------------------
function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    if (data.date === new Date().toISOString().slice(0, 10)) {
      return data.locations;
    }
  }
  return {};
}

function saveCache(results) {
  const data = {
    date: new Date().toISOString().slice(0, 10),
    locations: results,
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

// ------------------
// CSV helpers
// ------------------
function convertToCSV(arr) {
  if (!arr.length) return "";
  const headers = Object.keys(arr[0]);
  const rows = arr.map((row) => headers.map((h) => row[h]).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const processedCSV = [];
    let zipColumn;
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);

    readable
      .pipe(csv())
      .on("headers", (headers) => {
        zipColumn = headers.find((h) => h.toLowerCase().includes("zip"));
        if (!zipColumn) console.warn("No ZIP column detected in CSV");
      })
      .on("data", (row) => {
        processedCSV.push(row);
        if (zipColumn && row[zipColumn]) row.zip = row[zipColumn]; // normalize
      })
      .on("end", () => resolve(processedCSV))
      .on("error", reject);
  });
}

// ------------------
// Fetch helpers
// ------------------
async function fetchDailyData(lat, lon) {
  try {
    const [weatherRes, aqiRes] = await Promise.all([
      axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`),
      axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi&timezone=auto`)
    ]);

    const maxTemp = weatherRes.data.daily.temperature_2m_max[0];
    const maxAqi = Math.max(...aqiRes.data.hourly.us_aqi);

    return { maxTemp, maxAqi };
  } catch (err) {
    return { error: err.message };
  }
}

// ------------------
// Upload endpoint
// ------------------
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const buffer = req.file.buffer;
  try {
    // Parse CSV
    const processedCSV = await parseCsvBuffer(buffer);

    // Deduplicate ZIPs
    const uniqueZips = [...new Set(processedCSV.map(r => r.zip).filter(Boolean))];
    
processedCSV.forEach(r => {
  r.Plan_zip = r.zip;  // unified column
});



    // Load cache
    const cache = loadCache();

    // Prepare promises for all ZIPs not in cache
    const fetchPromises = uniqueZips.map(async (zip) => {
      if (cache[zip]) return { zip, data: cache[zip] }; // use cache

      const info = zipcodes.lookup(zip);
      if (!info) return { zip, data: { error: "Invalid ZIP" } };

      const data = await fetchDailyData(info.latitude, info.longitude);
      return {
        zip,
        data: {
          ...data,
          latitude: info.latitude,
          longitude: info.longitude,
          city: info.city,
          state: info.state,
        },
      };
    });

    // Execute all fetches in parallel
    const resultsArray = await Promise.all(fetchPromises);

    // Combine results and update cache
    const apiResults = { ...cache };
    resultsArray.forEach(({ zip, data }) => {
      apiResults[zip] = data;
    });
    saveCache(apiResults);

    // --- Log AQI + Temperature summary ---
console.log("=== AQI + Heat Data Summary ===");
Object.entries(apiResults).forEach(([zip, data]) => {
  if (!data) {
    console.log(`ZIP ${zip}: No data`);
    return;
  }

  const maxAqi = data.maxAqi ?? "N/A";
  const maxTemp = data.maxTemp ?? "N/A";
  console.log(`ZIP ${zip}: AQI sample=${maxAqi}, Temp sample=${maxTemp}`);
});


    // Save temp files for Python processing
    const tempCsvPath = `./temp/input_${Date.now()}.csv`;
    const tempApiPath = `./temp/api_results_${Date.now()}.json`;
    fs.writeFileSync(tempCsvPath, convertToCSV(processedCSV));
    fs.writeFileSync(tempApiPath, JSON.stringify(apiResults, null, 2));

    // Call Python script
const pyProcess = spawn("python3", ["./process_csv.py", tempCsvPath, tempApiPath]);
let pythonOutput = "";
pyProcess.stdout.on("data", (data) => { pythonOutput += data.toString(); });
pyProcess.stderr.on("data", (err) => console.error(err.toString()));

pyProcess.on("close", () => {
  let processedData;
  try {
    processedData = JSON.parse(pythonOutput); // now it's JSON
  } catch (err) {
    console.error("Error parsing Python JSON:", err);
    processedData = [];
  }

  insertCsvRows(processedData);
  insertApiData(apiResults);

  fs.unlinkSync(tempCsvPath);
  fs.unlinkSync(tempApiPath);

  res.json({
    message: "Processing complete",
    processedData, // directly JSON
    apiResults,
  });
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional SQL query endpoint
app.post("/api/query", async (req, res) => {
  const { sql } = req.body;

  if (!sql) return res.status(400).json({ success: false, error: "No SQL provided" });

  try {
    const rows = await runQuery(sql); // ✅ use runQuery from your db module
    res.json({ success: true, rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

// Forecast endpoint for next 5 days hourly AQI + temperature
app.get("/api/forecast/:zip", async (req, res) => {
  const { zip } = req.params;

  try {
    // Lookup lat/lon using the `zipcodes` library
    const info = zipcodes.lookup(zip);
    if (!info) {
      return res.status(400).json({ error: "Invalid ZIP code" });
    }

    const { latitude: lat, longitude: lon } = info;

    // Fetch AQI and temperature (next 5 days hourly)
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi&forecast_days=5&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&forecast_days=5&timezone=auto&temperature_unit=fahrenheit`;

    const [aqiRes, heatRes] = await Promise.all([axios.get(aqiUrl), axios.get(weatherUrl)]);
    const aqiData = aqiRes.data;
    const heatData = heatRes.data;

    // Return combined result
    res.json({
      zip,
      latitude: lat,
      longitude: lon,
      hourly: {
        time: aqiData.hourly.time,
        us_aqi: aqiData.hourly.us_aqi,
        temperature_2m: heatData.hourly.temperature_2m,
      },
    });
  } catch (err) {
    console.error("Forecast fetch error:", err);
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
});


app.listen(5000, () => console.log("Server running on port 5000"));
