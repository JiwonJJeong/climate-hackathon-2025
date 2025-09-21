import React, { useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

const ZipTableWithModal = ({ tableData }) => {
  const [open, setOpen] = useState(false);
  const [selectedZip, setSelectedZip] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

const handleOpen = async (zip) => {
  console.log("Fetching forecast for ZIP:", zip, typeof zip);

  setSelectedZip(zip);
  setOpen(true);
  setLoading(true);
  setChartData([]);

  try {
    // ✅ Use full backend URL (or proxy)
    const res = await fetch(`http://localhost:5000/api/forecast/${zip}`);

    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // ✅ Safely map chart data
    if (data?.hourly?.time && data?.hourly?.us_aqi && data?.hourly?.temperature_2m) {
      const newData = data.hourly.time.map((time, idx) => ({
        time,
        AQI: data.hourly.us_aqi[idx],
        Heat: data.hourly.temperature_2m[idx],
      }));
      setChartData(newData);
    } else {
      console.warn("Unexpected data format:", data);
    }

  } catch (err) {
    console.error("Error fetching forecast:", err);
  } finally {
    setLoading(false);
  }
};


  const handleClose = () => {
    setOpen(false);
    setSelectedZip(null);
    setChartData([]);
  };

  return (
    <>
      <Paper sx={{ overflowX: "auto", mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              {tableData.length > 0 &&
                Object.keys(tableData[0]).map((col) => <TableCell key={col}>{col}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, i) => {
  return (
    <TableRow
      key={i}
      hover
      onClick={() => {
        console.log("Clicked row:", row); // 👀
        const zip = row.zip || row.Plan_zip || row.ZIP || row.Zip || row.plan_zip;
        console.log("Using ZIP:", zip);
        handleOpen(zip);
      }}
      sx={{ cursor: "pointer" }}
    >
      {Object.values(row).map((val, j) => (
        <TableCell key={j}>{val}</TableCell>
      ))}
    </TableRow>
  );
})}
          </TableBody>
        </Table>
      </Paper>

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxHeight: "90%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            overflowY: "auto",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            ZIP: {selectedZip}
          </Typography>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
              <Typography>Loading forecast...</Typography>
            </Box>
          ) : chartData.length > 0 ? (
            <>
              <Typography variant="subtitle1">AQI vs Time</Typography>
              <LineChart width={700} height={300} data={chartData} margin={{ top: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="AQI" stroke="#ff7300" />
              </LineChart>

              <Typography variant="subtitle1" sx={{ mt: 4 }}>
                Heat vs Time
              </Typography>
              <LineChart width={700} height={300} data={chartData} margin={{ top: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Heat" stroke="#387908" />
              </LineChart>
            </>
          ) : (
            <Typography>No chart data available</Typography>
          )}

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button onClick={handleClose} variant="contained">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ZipTableWithModal;
