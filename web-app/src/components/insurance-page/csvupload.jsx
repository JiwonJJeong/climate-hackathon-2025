import React, { useState } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";

const CSVUploader = ({ onUploadStart, onSuccess, onError }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(null);
    setError(null);
  };

  const handleUpload = async () => {
  if (!file) {
    setError("Please select a CSV file first.");
    if (onError) onError("Please select a CSV file first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    if (onUploadStart) onUploadStart();

    const response = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      setMessage(result.message || "Upload successful!");
      setError(null);
      console.log("Upload succeeded, apiResults:", result.apiResults);

      if (onSuccess) onSuccess(result.apiResults); // pass backend data to parent
    } else {
      setError(result.error || "Upload failed.");
      setMessage(null);
      if (onError) onError(result.error || "Upload failed.");
    }
  } catch (err) {
    console.error("Upload fetch error:", err);
    setError("Error uploading file.");
    if (onError) onError("Error uploading file.");
  }
};


  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 500,
        mx: "auto",
        textAlign: "center",
        border: "2px dashed",
        borderColor: "grey.400",
        borderRadius: 3,
        backgroundColor: "grey.50",
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: "grey.100",
        },
        transition: "all 0.3s ease",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Upload CSV File
      </Typography>

      <Box sx={{ mb: 2 }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: "block", margin: "0 auto", marginBottom: "1rem" }}
        />
        {file && (
          <Typography variant="body2" color="textSecondary">
            Selected: {file.name}
          </Typography>
        )}
      </Box>

      <Button variant="contained" color="primary" onClick={handleUpload} disabled={!file}>
        Upload
      </Button>

      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CSVUploader;
