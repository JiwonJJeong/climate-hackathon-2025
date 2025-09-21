import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Paper, Typography, Box } from "@mui/material";

function SingleLineGraph({ data, dataKey, name, stroke, height }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time" 
          tickFormatter={(value, index) => `Day ${index + 1}`} // <-- format as Day 1, Day 2...
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={dataKey} stroke={stroke} name={name} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function HealthDataGraphs({ data }) {
  return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SingleLineGraph data={data} dataKey="risk" name="Risk Factor" stroke="#ff7300" height={300} />
        <SingleLineGraph data={data} dataKey="aqi" name="AQI" stroke="#8884d8" height={300} />
        <SingleLineGraph data={data} dataKey="temp" name="Temperature (°F)" stroke="#82ca9d" height={300} />
      </Box>
  );
}
