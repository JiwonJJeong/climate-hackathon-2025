// CSVUploader.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  CircularProgress, 
  List,
  ListItem,
  ListItemText,
  Paper,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const CSVUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);

  // Parse CSV data into table format (first 100 rows only)
  const parseCSVData = (csvText) => {
    if (!csvText) return { headers: [], rows: [], totalRows: 0 };
    
    const lines = csvText.trim().split('\n');
    const rawHeaders = lines[0].split(',');
    // Normalize headers: lowercase and replace spaces with underscores
    const headers = rawHeaders.map(header => 
      header.trim().toLowerCase().replace(/\s+/g, '_')
    );
    const allRows = lines.slice(1).map(line => line.split(','));
    const rows = allRows.slice(0, 100); // Only show first 100 rows
    
    return { headers, rows, totalRows: allRows.length };
  };

  // Load available files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:2003/api/files');
      const result = await response.json();
      setFiles(result.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

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
      const response = await fetch('http://localhost:2003/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'Upload successful!');
        setError(null);
        fetchFiles(); // Refresh file list
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

  const viewFile = async (filename) => {
    try {
      setLoading(true);
      // Fetch file data
      const response = await fetch(`http://localhost:2003/api/view/${filename}`);
      const result = await response.json();
      setFileData(result.data);
      setSelectedFile(filename);
      
      // Fetch data summary
      const summaryResponse = await fetch(`http://localhost:2003/api/data-summary/${filename}`);
      const summaryResult = await summaryResponse.json();
      setDataSummary(summaryResult);
      
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Error loading file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 800 }}>
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

      {/* Available Files Section */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Files
        </Typography>
        
        <List>
          {files.map((filename) => (
            <ListItem key={filename} sx={{ border: '1px solid #ddd', mb: 1, borderRadius: 1 }}>
              <ListItemText primary={filename} />
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => viewFile(filename)}
                disabled={loading}
              >
                View Data
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>
      {/* File Data Display */}
      
      {selectedFile && fileData && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data from: {selectedFile}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing first 100 rows of {parseCSVData(fileData).totalRows.toLocaleString()} total rows
          </Typography>

          {/* Data Summary */}
          {dataSummary && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Data Summary
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                {/* Basic Stats */}
                <Box>
                  <Typography variant="subtitle2" color="primary">Basic Info</Typography>
                  <Typography variant="body2">Total Records: {dataSummary.total_records?.toLocaleString()}</Typography>
                  {dataSummary.average_age && (
                    <Typography variant="body2">Average Age: {dataSummary.average_age}</Typography>
                  )}
                  {dataSummary.percent_female !== null && (
                    <Typography variant="body2">% Female: {dataSummary.percent_female}%</Typography>
                  )}
                </Box>

                {/* Medical Conditions */}
                {dataSummary.condition_percentages && Object.keys(dataSummary.condition_percentages).length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="primary">Medical Conditions</Typography>
                    {Object.entries(dataSummary.condition_percentages).map(([condition, percentage]) => (
                      <Typography key={condition} variant="body2">
                        % {condition.replace('_', ' ')}: {percentage}%
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* Payers */}
                {dataSummary.payer_distribution && Object.keys(dataSummary.payer_distribution).length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="primary">Payer Distribution</Typography>
                    {Object.entries(dataSummary.payer_distribution).map(([payer, percentage]) => (
                      <Typography key={payer} variant="body2">
                        {payer}: {percentage}%
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {parseCSVData(fileData).headers.map((header, index) => (
                    <TableCell key={index} sx={{ fontWeight: 'bold', fontSize: '12px' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {parseCSVData(fileData).rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} sx={{ fontSize: '12px' }}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="outlined" disabled>
              Load More Rows (Coming Soon)
            </Button>
          </Box>
        </Box>
      )}
      
      {selectedFile && !fileData && (
        <Typography color="error">File selected but no data loaded</Typography>
      )}
    </Box>
  );
};

export default CSVUploader;