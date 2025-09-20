// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' }); // Saves file to /uploads

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('Uploaded file:', req.file.originalname);
  res.json({ message: 'CSV uploaded successfully!' });
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
