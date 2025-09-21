import React, { useState, useEffect } from "react";
import CSVUploader from "./csvupload";
import MultiQueryBuilder from "./datepicker"; // SQL builder
import ZipTableWithModal from "./table"; // table with charts
import { Box, CircularProgress, Typography } from "@mui/material";

const Insurance = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aqiHeatData, setAqiHeatData] = useState(null);
  const [query, setQuery] = useState("");
  const [tableData, setTableData] = useState([]);

  // Fetch table data whenever query changes
  useEffect(() => {
    if (!query) return;

    const fetchTableData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql: query }),
        });
        const data = await response.json();
        setTableData(data.rows || []); // ✅ replace old data, do not append
      } catch (err) {
        console.error("Error fetching table data:", err);
        setTableData([]);
      }
    };

    fetchTableData();
  }, [query]);

  // Set default query once aqiHeatData is ready
  useEffect(() => {
    if (aqiHeatData) {
      const defaultQuery =
        "SELECT * FROM csv_rows WHERE risk_factor >= 10 ORDER BY risk_factor ASC;";
      setQuery(defaultQuery);
    }
  }, [aqiHeatData]);

  return (
    <Box sx={{ px: 2 }}>
      {/* CSV uploader */}
      {!aqiHeatData && !isProcessing && (
        <CSVUploader
          onUploadStart={() => setIsProcessing(true)}
          onSuccess={(results) => {
            setAqiHeatData(results);
            setIsProcessing(false);
          }}
          onError={(err) => {
            console.error(err);
            setIsProcessing(false);
          }}
        />
      )}

      {/* Loading spinner */}
      {isProcessing && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Processing CSV...</Typography>
        </Box>
      )}

      {/* SQL builder */}
      {aqiHeatData && !isProcessing && (
        <Box sx={{ mt: 4 }}>
          <MultiQueryBuilder
            onQueryChange={(sql) => setQuery(sql)}
            zipOptions={Object.keys(aqiHeatData)}
          />
        </Box>
      )}

      {/* Results table */}
      {aqiHeatData && tableData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Query Results
          </Typography>
          <ZipTableWithModal tableData={tableData} aqiHeatData={aqiHeatData} />
        </Box>
      )}
    </Box>
  );
};

export default Insurance;
