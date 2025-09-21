# Climate Hackathon 2025 - Python FastAPI Backend

This is the Python FastAPI backend for the Climate Hackathon 2025 project.

## 🚀 Quick Start

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run the Server
```bash
# Option 1: Using the run script
python run.py

# Option 2: Direct uvicorn
uvicorn main:app --host 0.0.0.0 --port 2003 --reload

# Option 3: Direct python
python main.py
```

## 📋 API Endpoints

The server runs on **http://localhost:2003**

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `POST /api/upload` - File upload endpoint (CSV files only)
- `GET /api/get_weather` - Mock weather data
- `GET /api/get_risk` - Risk calculation based on age, AQI, temperature
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## 🔧 Usage

### File Upload
```bash
curl -X POST "http://localhost:2003/api/upload" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your_file.csv"
```

### Risk Calculation
```bash
curl "http://localhost:2003/api/get_risk?age=65&aqi=200&temperature=35"
```

### Health Check
```bash
curl http://localhost:2003/health
```

## 📊 Interactive Documentation

Visit http://localhost:2003/docs for interactive API documentation where you can test all endpoints directly in your browser.

## 🧪 Development

- **Framework**: FastAPI
- **Server**: Uvicorn
- **Port**: 2003
- **Auto-reload**: Enabled in development mode

## 📁 File Structure

```
backend_python/
├── main.py          # Main FastAPI application
├── run.py           # Simple run script
├── requirements.txt # Python dependencies
├── uploads/         # File upload directory
└── README.md        # This file
```
