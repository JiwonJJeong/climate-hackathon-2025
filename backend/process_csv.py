import sys
import csv
import json

def main():
    if len(sys.argv) < 3:
        print("Usage: python process_csv.py <csv_path> <api_json_path>", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    api_json_path = sys.argv[2]

    # Load CSV
    with open(csv_path, newline='') as f:
        reader = list(csv.DictReader(f))
        fieldnames = reader[0].keys() if reader else []

    # Load API results
    with open(api_json_path) as f:
        api_results = json.load(f)

    # Debug: simple summary to stderr
    print("=== Python: AQI + Heat Data Summary ===", file=sys.stderr)
    for zip_code, data in api_results.items():
        max_aqi = data.get("maxAqi", "N/A")
        max_temp = data.get("maxTemp", "N/A")
        print(f"ZIP {zip_code}: AQI sample={max_aqi}, Temp sample={max_temp}", file=sys.stderr)

    # Columns to keep
    keep_columns = [
        "MemberID",
        "Payer",
        "Plan_zip",  # standardized name
        "fake_name",
        "fake_email",
        "fake_phone"
    ]

    # Health columns to sum for risk_factor
    health_columns = [
        "diabetes",
        "hypertension",
        "chronic_kidney",
        "liver_disease",
        "copd",
        "heart_disease",
        "comorbidity_count",
        "Age"
    ]

    output_rows = []
    for row in reader:
        # Standardize ZIP column
        row["Plan_zip"] = row.pop("Plan Zip", row.get("PlanZip", row.get("Plan_zip", "")))

        # Compute risk_factor
        risk_factor = 0
        for col in health_columns:
            try:
                risk_factor += int(row.get(col, 0))
            except ValueError:
                risk_factor += 0

        # Build new row
        new_row = {col: row.get(col, "") for col in keep_columns}

        # Attach API data if zip matches
        zip_code = row.get("Plan_zip")
        api_data = api_results.get(zip_code, {})
        new_row["maxTemp"] = api_data.get("maxTemp", "N/A")
        new_row["maxAqi"] = api_data.get("maxAqi", "N/A")

        new_row["risk_factor"] = risk_factor
        output_rows.append(new_row)

    # Debug info to stderr
    print("=== Python debug ===", file=sys.stderr)

    # JSON output only
    json.dump(output_rows, sys.stdout)

if __name__ == "__main__":
    main()
