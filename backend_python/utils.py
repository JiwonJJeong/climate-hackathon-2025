import os
import pickle
import pandas as pd
import numpy as np

# Global variable to store the loaded model
model_data = None

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