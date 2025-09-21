import sys
import json
import traceback

def model_function(patient, temp, aqi):
    """
    Computes risk factor for a single time point.
    Handles string/numeric conversions safely.
    """
    risk = 0

    # Safely convert age to integer
    try:
        age = int(patient.get("age", 0))
    except (ValueError, TypeError):
        age = 0
    if age > 65:
        risk += 1

    # Diabetes check
    if str(patient.get("diabetes", "")).lower() == "yes":
        risk += 1

    # Safely handle AQI
    try:
        aqi_val = float(aqi) if aqi is not None else 0
    except (ValueError, TypeError):
        aqi_val = 0
    if aqi_val > 100:
        risk += 1

    # Safely handle temperature
    try:
        temp_val = float(temp) if temp is not None else 0
    except (ValueError, TypeError):
        temp_val = 0
    if temp_val > 30:
        risk += 0.5

    return round(risk, 2)


def compute_risk_per_hour(patient, hourly_data):
    """
    Compute risk factor for each hourly time point.
    Returns a list of dicts with time, temperature, AQI, and risk_factor.
    """
    times = hourly_data.get("time", [])
    temps = hourly_data.get("temperature", [])
    aqis = hourly_data.get("aqi", [])

    results = []
    for i in range(len(times)):
        time = times[i]
        temp = temps[i] if i < len(temps) else None
        aqi = aqis[i] if i < len(aqis) else None
        risk_factor = model_function(patient, temp, aqi)
        results.append({
            "time": time,
            "temperature": temp,
            "aqi": aqi,
            "risk_factor": risk_factor
        })
    return results


def main(patient_file, api_file):
    try:
        # Load input JSON files
        with open(patient_file, "r") as f:
            patient = json.load(f)
        with open(api_file, "r") as f:
            hourly_data = json.load(f)

        hourly_risks = compute_risk_per_hour(patient, hourly_data)

        # Output JSON for backend
        print(json.dumps(hourly_risks))
        sys.stdout.flush()

    except Exception as e:
        # Always return JSON on error
        print(json.dumps({"error": str(e), "trace": traceback.format_exc()}))
        sys.stdout.flush()


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
