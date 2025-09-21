// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const upload = multer({ dest: 'uploads/' });

// HEALTH CHECK ENDPOINT
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: [
      'GET /health',
      'POST /api/upload'
    ]
  });
});

// ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({
    message: 'Climate Hackathon 2025 Backend API',
    status: 'running',
    endpoints: {
      health: '/health',
      upload: '/api/upload'
    }
  });
});
// FILE UPLOAD ENDPOINT
app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log('Upload request received');
  
  if (!req.file) {
    console.log('No file in request');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('Uploaded file:', req.file.originalname);
  console.log('File saved to:', req.file.path);
  
  res.json({ 
    message: 'CSV uploaded successfully!',
    filename: req.file.originalname,
    path: req.file.path
  });
});


// START SERVER
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/upload`);
  console.log('='.repeat(50));
});