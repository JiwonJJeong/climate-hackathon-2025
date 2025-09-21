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
  Collapse
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
      console.log('Fetching file:', filename);
      const response = await fetch(`http://localhost:2003/api/view/${filename}`);
      console.log('Response received:', response.status);
      const result = await response.json();
      console.log('File data result:', result);
      console.log('Data content:', result.data);
      setFileData(result.data);
      setSelectedFile(filename);
      console.log('State set - selectedFile:', filename, 'fileData:', result.data?.substring(0, 50));
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Error loading file: ' + err.message);
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
      <Typography variant="body2" color="text.secondary">
        Debug: selectedFile="{selectedFile}", fileData length={fileData?.length || 0}
      </Typography>
      
      {selectedFile && fileData && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data from: {selectedFile}
          </Typography>
          
          <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
              {fileData}
            </pre>
          </Paper>
        </Box>
      )}
      
      {selectedFile && !fileData && (
        <Typography color="error">File selected but no data loaded</Typography>
      )}
    </Box>
  );
};

export default CSVUploader;