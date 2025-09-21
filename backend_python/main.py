# main.py - FastAPI Backend for Climate Hackathon 2025
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import shutil
from datetime import datetime
import time
import pandas as pd
import numpy as np
from utils import load_model, predict_risk_percentage

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

# Load the climate health model at startup
print("Loading climate health model...")
load_model()

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
        file_path = os.path.join("uploads", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        print(f"File content length: {len(content)}")
        print(f"First 100 chars: {content[:100]}")
        
        return {"data": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/data-summary/{filename}")
async def get_data_summary(filename: str):
    """Get clean data summary statistics"""
    try:
        file_path = os.path.join("uploads", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read CSV file with pandas
        df = pd.read_csv(file_path)
        
        # Basic counts
        total_records = len(df)
        
        # Age stats (handle different possible column names)
        age_col = None
        for col in ['Age', 'age', 'AGE']:
            if col in df.columns:
                age_col = col
                break
        avg_age = df[age_col].mean() if age_col else None
        
        # Gender stats (F percentage)
        gender_col = None
        for col in ['gender', 'Gender', 'GENDER']:
            if col in df.columns:
                gender_col = col
                break
        
        pct_female = None
        if gender_col:
            if df[gender_col].dtype == 'object':  # String values like 'F', 'M'
                pct_female = (df[gender_col] == 'F').mean() * 100
            else:  # Numeric values like 0, 1
                pct_female = (df[gender_col] == 0).mean() * 100
        
        # Medical conditions percentages
        conditions = ['diabetes', 'hypertension', 'chronic_kidney', 'liver_disease', 'copd', 'heart_disease']
        condition_stats = {}
        
        for condition in conditions:
            # Try different case variations
            col_found = None
            for col in df.columns:
                if col.lower().replace(' ', '_') == condition:
                    col_found = col
                    break
            
            if col_found:
                condition_stats[condition] = (df[col_found] == 1).mean() * 100
        
        # Payer distribution
        payer_col = None
        for col in ['Payer', 'payer', 'PAYER']:
            if col in df.columns:
                payer_col = col
                break
        
        payer_stats = {}
        if payer_col:
            payer_counts = df[payer_col].value_counts()
            payer_stats = {
                payer: (count / total_records * 100) 
                for payer, count in payer_counts.items()
            }
        
        return {
            "total_records": total_records,
            "average_age": round(avg_age, 1) if avg_age else None,
            "percent_female": round(pct_female, 1) if pct_female else None,
            "condition_percentages": {k: round(v, 1) for k, v in condition_stats.items()},
            "payer_distribution": {k: round(v, 1) for k, v in payer_stats.items()}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/compute_risk")
async def compute_risk(age: int, aqi: int = 150, diabetes: int = 0, hypertension: int = 0, heart_disease: int = 0):
    """Calculate health risk using the trained climate health model"""
    print(f"Risk calculation requested - Age: {age}, AQI: {aqi}, Diabetes: {diabetes}, Hypertension: {hypertension}, Heart Disease: {heart_disease}")
    
    try:
        # Use the trained model to predict risk
        risk_percentage = predict_risk_percentage(age, aqi, diabetes, hypertension, heart_disease)
        
        result = {
            "risk_percentage": risk_percentage,
            "inputs": {
                "age": age,
                "aqi": aqi,
                "diabetes": diabetes,
                "hypertension": hypertension,
                "heart_disease": heart_disease
            }
        }
        
        print(f"Risk calculation result: {result}")
        return result
        
    except Exception as e:
        print(f"Error calculating risk: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating risk: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=2003, 
        reload=True,
        log_level="info"
    )
