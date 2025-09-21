import os
import pickle

# Global variable to store the loaded model
model_data = None

def load_model():
    """Load the pickled model once at startup"""
    global model_data
    try:
        model_path = os.path.join(os.path.dirname(__file__), '..', 'data-exploration', 'climate_health_model.pkl')
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        print("✅ Climate health model loaded successfully!")
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
    
    # Create input array with significant features only
    input_data = np.array([[age, aqi, diabetes, hypertension, heart_disease]])
    
    # Scale the input
    input_scaled = model_data['scaler'].transform(input_data)
    
    # Predict probability and convert to percentage
    risk_probability = model_data['model'].predict_proba(input_scaled)[0, 1]
    risk_percentage = risk_probability * 100
    
    return round(risk_percentage, 2)