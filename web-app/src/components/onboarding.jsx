// CSVUploader.js
import React, { useState } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import WeatherAirQualityChart from './weatheraqpicker.jsx'

const CSVUploader = () => {
  console.log('hello')
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'Upload successful!');
        setError(null);
      } else {
        setError(result.error || 'Upload failed.');
        setMessage(null);
      }
    } catch (err) {
      setError('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Upload CSV File
      </Typography>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ marginBottom: '1rem' }}
      />

      <Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? <CircularProgress size={24} color="inherit" /> : 'Upload'}
        </Button>
      </Box>

      {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <WeatherAirQualityChart/>
    </Box>
  );
};

export default CSVUploader;
