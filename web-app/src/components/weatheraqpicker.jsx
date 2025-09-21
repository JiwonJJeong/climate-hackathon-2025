import React from 'react';
import { Box, Typography } from '@mui/material';

const WeatherAirQualityChart = () => {
  return (
    <Box sx={{ padding: 2, marginTop: 2, border: '1px solid #ddd', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Weather & Air Quality Chart
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Weather and air quality visualization will be displayed here.
      </Typography>
    </Box>
  );
};

export default WeatherAirQualityChart;
