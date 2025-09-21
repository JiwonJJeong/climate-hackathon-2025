// db.js
const Database = require('better-sqlite3');

const db = new Database(':memory:'); // in-memory DB

// Clear CSV rows table before inserting new CSV data
function insertCsvRows(rows) {
  db.prepare("DELETE FROM csv_rows").run(); // <- clear old data first

  const stmt = db.prepare(`
    INSERT INTO csv_rows(
      member_id, payer, plan_zip, fake_name, fake_email, fake_phone, risk_factor
    )
    VALUES(@MemberID, @Payer, @Plan_zip, @fake_name, @fake_email, @fake_phone, @risk_factor)
  `);

  rows.forEach(r => stmt.run(r));
}


// CSV rows table (matches new processed CSV structure)
db.exec(`
  CREATE TABLE IF NOT EXISTS csv_rows (
    id INTEGER PRIMARY KEY,
    member_id TEXT,
    payer TEXT,
    plan_zip TEXT,
    fake_name TEXT,
    fake_email TEXT,
    fake_phone TEXT,
    risk_factor INTEGER
  );
`);

// API results table
db.exec(`
  CREATE TABLE IF NOT EXISTS api_data (
    id INTEGER PRIMARY KEY,
    zip TEXT,
    latitude REAL,
    longitude REAL,
    aqi TEXT,
    heat TEXT
  );
`);

// Insert API results
function insertApiData(results) {
  db.prepare("DELETE FROM api_data").run(); // clear old API data first

  const stmt = db.prepare(`
    INSERT INTO api_data(zip, latitude, longitude, aqi, heat)
    VALUES(@zip, @latitude, @longitude, @aqi, @heat)
  `);

  Object.entries(results).forEach(([zip, data]) => {
    stmt.run({
      zip,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      aqi: JSON.stringify(data.aqiData || {}),
      heat: JSON.stringify(data.heatData || {})
    });
  });
}


// Execute arbitrary SQL queries
function runQuery(sql) {
  try {
    return db.prepare(sql).all();
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = { insertCsvRows, insertApiData, runQuery };
