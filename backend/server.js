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
app.use(express.json());

// Ensure temp folder exists
if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');

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
        // Normalize Member_ID as string
        if (row.member_id) row.Member_ID = String(row.member_id);
        else if (row.Member_ID) row.Member_ID = String(row.Member_ID);

        processedCSV.push(row);

        // Normalize ZIP column
        if (zipColumn && row[zipColumn]) row.zip = row[zipColumn];
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

async function fetchHourlyData(lat, lon) {
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi&forecast_days=5&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&forecast_days=5&timezone=auto&temperature_unit=fahrenheit`;

  const [aqiRes, heatRes] = await Promise.all([
    axios.get(aqiUrl),
    axios.get(weatherUrl),
  ]);

  return {
    time: aqiRes.data.hourly.time,
    aqi: aqiRes.data.hourly.us_aqi,
    temperature: heatRes.data.hourly.temperature_2m,
  };
}


// ------------------
// Upload endpoint
// ------------------
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const buffer = req.file.buffer;
  try {
    const processedCSV = await parseCsvBuffer(buffer);

    const uniqueZips = [...new Set(processedCSV.map(r => r.zip).filter(Boolean))];
    processedCSV.forEach(r => r.Plan_zip = r.zip);

    const cache = loadCache();

    const fetchPromises = uniqueZips.map(async (zip) => {
      if (cache[zip]) return { zip, data: cache[zip] };
      const info = zipcodes.lookup(zip);
      if (!info) return { zip, data: { error: "Invalid ZIP", patients: [] } };
      const data = await fetchDailyData(info.latitude, info.longitude);
      return { zip, data: { ...data, latitude: info.latitude, longitude: info.longitude, city: info.city, state: info.state, patients: [] } };
    });

    const resultsArray = await Promise.all(fetchPromises);

    const apiResults = { ...cache };
    resultsArray.forEach(({ zip, data }) => {
      apiResults[zip] = { ...data, patients: data.patients || [] };
    });

    // Add patients from CSV
    processedCSV.forEach(r => {
      const zip = r.zip;
      if (!apiResults[zip].patients) apiResults[zip].patients = [];
      apiResults[zip].patients.push(r);
    });

    saveCache(apiResults);

    // --- Logging ---
    console.log("=== AQI + Heat Data Summary ===");
    Object.entries(apiResults).forEach(([zip, data]) => {
      if (!data) { console.log(`ZIP ${zip}: No data`); return; }
      console.log(`ZIP ${zip}: AQI sample=${data.maxAqi ?? "N/A"}, Temp sample=${data.maxTemp ?? "N/A"}, Patients=${data.patients.length}`);
    });

    // Save temp files & call Python
    const tempCsvPath = `./temp/input_${Date.now()}.csv`;
    const tempApiPath = `./temp/api_results_${Date.now()}.json`;
    fs.writeFileSync(tempCsvPath, convertToCSV(processedCSV));
    fs.writeFileSync(tempApiPath, JSON.stringify(apiResults, null, 2));

    const pyProcess = spawn("python3", ["./process_csv.py", tempCsvPath, tempApiPath]);
    let pythonOutput = "";
    pyProcess.stdout.on("data", (data) => pythonOutput += data.toString());
    pyProcess.stderr.on("data", (err) => console.error(err.toString()));

    pyProcess.on("close", () => {
      let processedData = [];
      try { processedData = JSON.parse(pythonOutput); } 
      catch (err) { console.error("Error parsing Python JSON:", err); }

      insertCsvRows(processedData);
      insertApiData(apiResults);

      fs.unlinkSync(tempCsvPath);
      fs.unlinkSync(tempApiPath);

      res.json({ message: "Processing complete", processedData, apiResults });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------
// SQL Query endpoint
// ------------------
app.post("/api/query", async (req, res) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ success: false, error: "No SQL provided" });

  try {
    const rows = await runQuery(sql);
    res.json({ success: true, rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

// ------------------
// Forecast endpoint
// ------------------
app.get("/api/forecast/:zip", async (req, res) => {
  const { zip } = req.params;
  const info = zipcodes.lookup(zip);
  if (!info) return res.status(400).json({ error: "Invalid ZIP" });
  
  try {
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${info.latitude}&longitude=${info.longitude}&hourly=us_aqi&forecast_days=5&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${info.latitude}&longitude=${info.longitude}&hourly=temperature_2m&forecast_days=5&timezone=auto`;

    const [aqiRes, heatRes] = await Promise.all([axios.get(aqiUrl), axios.get(weatherUrl)]);

    res.json({
      zip,
      latitude: info.latitude,
      longitude: info.longitude,
      hourly: {  // <--- this must match frontend
        time: aqiRes.data.hourly.time,
        us_aqi: aqiRes.data.hourly.us_aqi,
        temperature_2m: heatRes.data.hourly.temperature_2m
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
});


// ------------------
// Health data submit
// ------------------
// server.js (only the health form endpoint)
app.post("/api/submitHealthData", async (req, res) => {
  const record = req.body;
  if (!record || !record.zip) return res.status(400).json({ error: "ZIP code is required" });

  try {
    record.Plan_zip = record.zip;
    const cache = loadCache();
    const zip = record.zip;
    let hourlyData;

    // Use cached data if available
    if (cache[zip]?.hourly) {
      hourlyData = cache[zip].hourly;
    } else {
      const info = zipcodes.lookup(zip);
      if (!info) return res.status(400).json({ error: "Invalid ZIP" });

      hourlyData = await fetchHourlyData(info.latitude, info.longitude);

      // Normalize keys to match Python
      hourlyData = {
        time: hourlyData.time,
        temperature: hourlyData.temperature,
        aqi: hourlyData.aqi,
      };

      cache[zip] = { ...cache[zip], hourly: hourlyData };
      saveCache(cache);
    }

    // Save temp files for Python
    const tempPatientPath = `./temp/patient_${Date.now()}.json`;
    const tempApiPath = `./temp/api_${Date.now()}.json`;
    fs.writeFileSync(tempPatientPath, JSON.stringify(record, null, 2));
    fs.writeFileSync(tempApiPath, JSON.stringify(hourlyData, null, 2));

    // Spawn Python
    const pyProcess = spawn("python3", ["./process_patient.py", tempPatientPath, tempApiPath]);

    let pythonOutput = "";
    let pythonError = "";

    pyProcess.stdout.on("data", (data) => pythonOutput += data.toString());
    pyProcess.stderr.on("data", (data) => pythonError += data.toString());

    pyProcess.on("close", (code) => {
      // Always clean up temp files
      fs.unlinkSync(tempPatientPath);
      fs.unlinkSync(tempApiPath);

      if (code !== 0) {
        console.error("Python exited with code", code, pythonError);
        return res.status(500).json({ error: "Python processing failed", details: pythonError });
      }


      let processedData;
      try {
        processedData = JSON.parse(pythonOutput);

        // If Python returned an error object
        if (!Array.isArray(processedData)) {
          console.error("Python returned error object:", processedData);
          return res.status(500).json({ error: processedData.error || "Python error", trace: processedData.trace });
        }
      } catch (err) {
        console.error("Error parsing Python JSON:", err, pythonOutput);
        return res.status(500).json({ error: "Failed to parse Python output", details: pythonOutput });
      }

      // Insert into DB correctly
      insertCsvRows(processedData); // flattened array, not [processedData]
      insertApiData({ [zip]: hourlyData });

      res.json({ message: "Processing complete", processedData, apiResult: hourlyData });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



app.listen(5000, () => console.log("Server running on port 5000"));
