# main.py - FastAPI Backend for Climate Hackathon 2025
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import shutil
from datetime import datetime
import time

app = FastAPI(
    title="Climate Hackathon 2025 Backend",
    description="Backend API for Climate Hackathon 2025",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Store server start time for uptime calculation
start_time = time.time()

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Climate Hackathon 2025 Backend API",
        "status": "running",
        "framework": "FastAPI",
        "endpoints": {
            "health": "/health",
            "upload": "/api/upload",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - start_time
    return {
        "status": "OK",
        "message": "Backend server is running",
        "framework": "FastAPI",
        "timestamp": datetime.now().isoformat(),
        "uptime": round(uptime, 2),
        "endpoints": [
            "GET /",
            "GET /health", 
            "POST /api/upload",
            "GET /docs"
        ]
    }

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """File upload endpoint"""
    print(f"Upload request received for file: {file.filename}")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check if it's a CSV file
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Save file to uploads directory
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"File saved to: {file_path}")
        
        return {
            "message": "CSV uploaded successfully!",
            "filename": file.filename,
            "path": file_path,
            "size": os.path.getsize(file_path)
        }
    
    except Exception as e:
        print(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Error saving file")

@app.get("/api/get_weather")
async def get_weather():
    """Get mock weather data"""
    return {
        "temperature": 25,
        "humidity": 60,
        "aqi": 150,
        "weather_condition": "partly_cloudy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/files")
async def list_files():
    """List all files in the data directory"""
    try:
        data_dir = "uploads"
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        files = [f for f in os.listdir(data_dir) if f.endswith('.csv')]
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/view/{filename}")
async def view_file(filename: str):
    """View file contents"""
    try:
        file_path = os.path.join("data", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        return {"data": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/compute_risk")
async def get_risk(age: int, gender: int = 0, aqi: int = 150, temperature: int = 25):
    """Calculate health risk based on parameters"""
    print(f"Risk calculation requested - Age: {age}, Gender: {gender}, AQI: {aqi}, Temperature: {temperature}")
    
    # Simple risk calculation
    base_risk = 20
    age_risk = (age - 30) * 0.5 if age > 30 else 0
    aqi_risk = (aqi - 100) * 0.1 if aqi > 100 else 0
    temp_risk = abs(temperature - 25) * 0.2
    
    total_risk = max(0, min(100, base_risk + age_risk + aqi_risk + temp_risk))
    
    result = {
        "risk_percentage": round(total_risk, 2),
        "risk_level": "Low" if total_risk < 30 else "Medium" if total_risk < 70 else "High",
        "factors": {
            "age": age_risk,
            "aqi": aqi_risk,
            "temperature": temp_risk
        },
        "inputs": {
            "age": age,
            "gender": gender,
            "aqi": aqi,
            "temperature": temperature
        }
    }
    
    print(f"Risk calculation result: {result}")
    return result

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=2003, 
        reload=True,
        log_level="info"
    )
