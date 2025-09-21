import os
import pickle
import pandas as pd
import numpy as np
import zipcodes
import httpx
import asyncio
import json

# Global variable to store the loaded model
model_data = None


import asyncio
import httpx
import json
import pandas as pd
import zipcodes

def get_unique_zips(df):
    return df['zip'].unique()

async def fetch_zip_data(zip_code, client):
    info = zipcodes.matching(zip_code)
    if not info:
        return { "zip": zip_code, "aqi": None, "error": "Invalid ZIP code" }

    lat = info[0]["lat"]
    lon = info[0]["long"]

    try:
        aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&daily=us_aqi&timezone=auto"
        resp = await client.get(aqi_url)
        data = resp.json()

        # Extract the first AQI value
        aqi = data["daily"]["us_aqi"][0] if "daily" in data and "us_aqi" in data["hourly"] else None

        return { "zip": zip_code, "aqi": aqi }

    except Exception as e:
        return { "zip": zip_code, "aqi": None, "error": str(e) }

async def fetch_multiple_zips(df, save=False):
    uzips = get_unique_zips(df)

    async with httpx.AsyncClient(timeout=10) as client:
        tasks = [fetch_zip_data(z, client) for z in uzips]
        results = await asyncio.gather(*tasks)

        # Convert to DataFrame
        result_df = pd.DataFrame(results)[["zip", "aqi"]]  # Only keep zip and aqi columns

        if save:
            result_df.to_json("data/tempaqi.json", orient="records", indent=2)

        return result_df

def load_model():
    """Load the pickled model once at startup"""
    global model_data
    try:
        # Get the absolute path to the model file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, '..', 'data-exploration', 'climate_health_model.pkl')
        model_path = os.path.abspath(model_path)
        
        print(f"🔍 Looking for model at: {model_path}")
        print(f"📁 Model file exists: {os.path.exists(model_path)}")
        
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        print("✅ Climate health model loaded successfully!")
        print(f"📊 Model type: {type(model_data)}")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        model_data = None
        return False

def predict_risk_percentage(age, aqi, diabetes, hypertension, heart_disease):
    """
    Predict risk percentage using the trained climate health model
    
    Returns:
    - risk_percentage: predicted risk as percentage (0-100%)
    """
    if model_data is None:
        raise Exception("Model not loaded")
    
    # Create DataFrame with proper feature names to avoid sklearn warnings
    feature_names = ['AGE', 'AQI', 'Diabetes', 'Hypertension', 'Heart_Disease']
    input_df = pd.DataFrame([[age, aqi, diabetes, hypertension, heart_disease]], 
                           columns=feature_names)
    
    # Scale the input
    input_scaled = model_data['scaler'].transform(input_df)
    
    # Predict probability and convert to percentage
    risk_probability = model_data['model'].predict_proba(input_scaled)[0, 1]
    risk_percentage = risk_probability * 100
    
    return round(risk_percentage, 2)

def predict_risk_batch(data_df):
    """
    Predict risk percentage for multiple patients at once (MUCH FASTER)
    
    Parameters:
    - data_df: DataFrame with columns ['Age', 'AQI', 'diabetes', 'hypertension', 'heart_disease']
    
    Returns:
    - list of risk percentages
    """
    if model_data is None:
        raise Exception("Model not loaded")
    
    # Prepare feature names
    feature_names = ['AGE', 'AQI', 'Diabetes', 'Hypertension', 'Heart_Disease']
    
    # Create input DataFrame with proper feature names
    input_df = pd.DataFrame({
        'AGE': data_df['Age'].astype(int),
        'AQI': data_df['AQI'].astype(int), 
        'Diabetes': data_df['diabetes'].astype(int),
        'Hypertension': data_df['hypertension'].astype(int),
        'Heart_Disease': data_df['heart_disease'].astype(int)
    })
    
    # Handle any NaN values
    input_df = input_df.fillna(0)
    
    # Scale all data at once (VECTORIZED - much faster)
    input_scaled = model_data['scaler'].transform(input_df)
    
    # Predict all probabilities at once (BATCH PREDICTION - much faster)
    risk_probabilities = model_data['model'].predict_proba(input_scaled)[:, 1]
    risk_percentages = (risk_probabilities * 100).round(2)
    
    return risk_percentages.tolist()

def get_weather(date: str, weather_path: str | None = None) -> pd.DataFrame:
    """
    Load weather data and return filtered rows for a given YYYYMMDD date.

    Parameters:
    - date: string like '20170101'
    - weather_path: optional explicit path to weather_data.csv

    Returns:
    - pandas DataFrame with columns ['zipcode', 'AQI', 'aqi_category'] for the given date
    """
    # Resolve default path relative to this file
    if weather_path is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        weather_path = os.path.abspath(os.path.join(current_dir, 'data', 'weather_data.csv'))

    if not os.path.exists(weather_path):
        raise FileNotFoundError(f"Weather data not found at {weather_path}")

    # Read only necessary columns for speed
    df = pd.read_csv(weather_path, usecols=['date', 'zipcode', 'AQI', 'aqi_category'])
    filtered = df[df['date'].astype(str) == str(date)][['zipcode', 'AQI', 'aqi_category']]
    return filtered.reset_index(drop=True)

def calc_inpatient_dollars_increase(df: pd.DataFrame) -> pd.DataFrame:
    """Augment dataframe with baseline_multiplier and inpatient_cost_increase using AQI lifts.

    - Load lift table from data/aqi_lift_ip_pnpm.csv
    - Ensure 'LOB' exists (fallback to 'Payer')
    - Merge on ['LOB', 'aqi_category'] to get 'lift_vs_baseline'
    - baseline_multiplier = lift_vs_baseline
    - inpatient_cost_increase = zip_base_pred_IP_PMPM * (baseline_multiplier - 1)
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    lift_path = os.path.abspath(os.path.join(current_dir, 'data', 'aqi_lift_ip_pnpm.csv'))
    if not os.path.exists(lift_path):
        lift_path = os.path.abspath(os.path.join('data', 'aqi_lift_ip_pnpm.csv'))

    lift_df = pd.read_csv(lift_path)

    working_df = df.copy()

    # Merge multiplier
    working_df = working_df.merge(
        lift_df[['LOB', 'aqi_category', 'lift_vs_baseline']],
        on=['LOB', 'aqi_category'],
        how='left'
    )

    base_col = 'zip_base_pred_IP_PMPM'
    if base_col in working_df.columns:
        working_df['inpatient_cost_increase'] = working_df[base_col] * (working_df['lift_vs_baseline'].fillna(1) - 1)
    else:
        working_df['inpatient_cost_increase'] = np.nan

    return working_df

def get_weather_current():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    weather_path = os.path.abspath(os.path.join(current_dir, 'data', 'weather_data.csv'))
    df = pd.read_csv(weather_path, usecols=[ 'zipcode'])
    df.to_csv('/data/zipaqi.csv',index=False)
    return fetch_multiple_zips(df)
