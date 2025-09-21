# main.py - FastAPI Backend for Climate Hackathon 2025
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
import os
import shutil
from datetime import datetime
import time
import pandas as pd
import numpy as np
from utils import load_model, predict_risk_percentage, predict_risk_batch

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

# Enable gzip compression for large responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

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
        files = [f for f in os.listdir(data_dir) 
                if f.endswith('.csv') and not f.startswith('ANALYSIS_')]
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/view/{filename}")
async def view_file(filename: str, rows: int | None = None):
    """View file contents (supports preview via rows param)"""
    try:
        file_path = os.path.join("uploads", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        # If rows is provided, return a preview using pandas (fast)
        if rows and rows > 0:
            df = pd.read_csv(file_path, nrows=rows)
            return {"data": df.to_csv(index=False)}

        # Otherwise return the full file (legacy behavior)
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
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

@app.get("/api/get_weather_data/{date}")
async def get_weather_data(date: str):
    """Get weather data for a specific date"""
    try:
        weather_file = os.path.join("data", "weather_data.csv")
        if not os.path.exists(weather_file):
            raise HTTPException(status_code=404, detail="Weather data file not found")
        
        # Read weather data
        df = pd.read_csv(weather_file)
        
        # Filter by date
        filtered_data = df[df['date'].astype(str) == date]
        
        if len(filtered_data) == 0:
            raise HTTPException(status_code=404, detail=f"No weather data found for date {date}")
        
        # Return only required columns
        result = filtered_data[['date', 'zipcode', 'AQI']].to_dict('records')
        
        return {
            "date": date,
            "count": len(result),
            "weather_data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/compute_risk_with_weather")
async def compute_risk_with_weather(date: str = None, filename: str = None):
    """Compute risk by merging patient data with weather data for a specific date"""
    try:
        # Load the model
        if not hasattr(compute_risk_with_weather, 'model_loaded'):
            load_model()
            compute_risk_with_weather.model_loaded = True
        
        # 1. Get weather data for the date
        weather_file = os.path.join("data", "weather_data.csv")
        if not os.path.exists(weather_file):
            raise HTTPException(status_code=404, detail="Weather data file not found")
        
        weather_df = pd.read_csv(weather_file)
        weather_filtered = weather_df[weather_df['date'].astype(str) == date][['zipcode', 'AQI']]
        
        if len(weather_filtered) == 0:
            raise HTTPException(status_code=404, detail=f"No weather data for date {date}")
        
        # 2. Load patient CSV file
        patient_file = os.path.join("uploads", filename)
        if not os.path.exists(patient_file):
            raise HTTPException(status_code=404, detail="Patient file not found")
        
        patient_df = pd.read_csv(patient_file)
        
        # 3. Match by zipcode (try different column names)
        zip_col = None
        for col in ['Plan Zip', 'plan_zip', 'zipcode', 'zip']:
            if col in patient_df.columns:
                zip_col = col
                break
        
        if not zip_col:
            raise HTTPException(status_code=400, detail="No zipcode column found in patient data")
        
        # Merge data
        merged_df = patient_df.merge(
            weather_filtered, 
            left_on=zip_col, 
            right_on='zipcode', 
            how='left'
        )
        
        # Fill missing AQI with median value
        merged_df['AQI'] = merged_df['AQI'].fillna(merged_df['AQI'].median())
        
        # 4. Apply the model
        required_cols = ['Age', 'AQI', 'diabetes', 'hypertension', 'heart_disease']
        
        # Check if required columns exist
        missing_cols = []
        for col in required_cols:
            if col not in merged_df.columns:
                # Try different variations
                variations = [col.lower(), col.upper(), col.replace('_', ' ')]
                found = False
                for var in variations:
                    if var in merged_df.columns:
                        merged_df[col] = merged_df[var]
                        found = True
                        break
                if not found:
                    missing_cols.append(col)
        
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")
        
        # Apply model to all rows at once (MUCH FASTER - batch processing)
        print(f"⚡ Processing {len(merged_df)} records with batch prediction...")
        start_time = time.time()
        
        try:
            # Use batch prediction for massive speed improvement
            risk_scores = predict_risk_batch(merged_df)
            merged_df['risk_percentage'] = risk_scores
            
            processing_time = time.time() - start_time
            print(f"✅ Batch processing completed in {processing_time:.2f} seconds")
            print(f"🚀 Speed: {len(merged_df)/processing_time:.0f} records/second")
            
        except Exception as e:
            print(f"❌ Batch processing failed: {e}")
            print("🔄 Falling back to row-by-row processing...")
            
            # Fallback to individual processing if batch fails
            risk_scores = []
            for _, row in merged_df.iterrows():
                try:
                    risk = predict_risk_percentage(
                        age=int(row['Age']),
                        aqi=int(row['AQI']),
                        diabetes=int(row['diabetes']),
                        hypertension=int(row['hypertension']),
                        heart_disease=int(row['heart_disease'])
                    )
                    risk_scores.append(risk)
                except Exception as e:
                    risk_scores.append(None)
            
            merged_df['risk_percentage'] = risk_scores
        
        # 5. Save updated file with special prefix
        output_filename = f"ANALYSIS_{date}_{filename}"
        output_path = os.path.join("uploads", output_filename)
        merged_df.to_csv(output_path, index=False)
        
        return {
            "message": "Risk analysis completed",
            "output_file": output_filename,
            "records_processed": len(merged_df),
            "weather_matches": len(merged_df[merged_df['AQI'].notna()]),
            "average_risk": merged_df['risk_percentage'].mean() if len(merged_df) > 0 else None
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
