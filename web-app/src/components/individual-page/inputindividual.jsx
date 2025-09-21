import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import HealthDataGraphs from "./graphs";


export default function HealthFormWithRisk() {
  const [formData, setFormData] = useState({
    zip: "",
    age: "",
    gender: "",
    diabetes: "",
    hypertension: "",
    chronic_kidney: "",
    liver_disease: "",
    copd: "",
    heart_disease: "",
    comorbidity_count: "",
  });

  const [riskFactor, setRiskFactor] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRiskFactor(null);
    setHourlyData([]);

    try {
      const response = await fetch("http://localhost:5000/api/submitHealthData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      

        console.log("First 5 entries of processedData:", data.processedData.slice(0, 5));

      const result = data.processedData[0];
      setRiskFactor(result?.risk_factor ?? "N/A");

      // Transform the hourly data for the graph
const hourlyFormatted = data.processedData.map((hour) => ({
  time: hour.time,               // API uses "time", not "timestamp"
  aqi: hour.aqi,
  temp: hour.temperature,        // API uses "temperature", not "temp"
  risk: hour.risk_factor,
}));

      setHourlyData(hourlyFormatted);
    } catch (err) {
      console.error("Error submitting form:", err);
      setRiskFactor("Error fetching risk factor");
    } finally {
      setLoading(false);
    }
  };

  const yesNoOptions = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
  ];

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      {!riskFactor && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Location and Health Background
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="ZIP Code" name="zip" value={formData.zip} onChange={handleChange} required />
            <TextField label="Age" type="number" name="age" value={formData.age} onChange={handleChange} required />

            <FormControl required>
              <InputLabel>Gender</InputLabel>
              <Select name="gender" value={formData.gender} onChange={handleChange}>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {["diabetes","hypertension","chronic_kidney","liver_disease","copd","heart_disease"].map((field) => (
              <FormControl key={field} required>
                <InputLabel>{field.replace("_", " ").toUpperCase()}</InputLabel>
                <Select name={field} value={formData[field]} onChange={handleChange}>
                  {yesNoOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            <TextField
              label="Comorbidity Count"
              type="number"
              name="comorbidity_count"
              value={formData.comorbidity_count}
              onChange={handleChange}
              required
            />

            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        </Paper>
      )}

      {riskFactor !== null && (
  <>
    <Paper sx={{ p: 3, textAlign: "center", mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Risk Factor
      </Typography>
      <Typography variant="h4" color="secondary">
        {riskFactor}
      </Typography>
    </Paper>

    {/* Render the separate graphs here, only if hourlyData exists */}
    {hourlyData.length > 0 && (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hourly Health Data
        </Typography>
        <HealthDataGraphs data={hourlyData} />
      </Paper>
    )}
  </>
)}
    </Box>
  );
}
