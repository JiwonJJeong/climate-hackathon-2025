import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Typography,
  Box,
  Paper,
  Slider,
  Button,
} from "@mui/material";

export default function MultiQueryBuilder({ zipOptions = [], onQueryChange }) {
  const [minIndex, setMinIndex] = React.useState(10); // initial = 10
  const [selectedZips, setSelectedZips] = React.useState([]);
  const [sortField, setSortField] = React.useState("risk_factor");
  const [sortOrder, setSortOrder] = React.useState("ASC");

  const generateQuery = (
    minIdx = minIndex,
    zips = selectedZips,
    sortF = sortField,
    sortO = sortOrder
  ) => {
    const conditions = [];
    if (minIdx > 0) conditions.push(`risk_factor >= ${minIdx}`);
    if (zips.length) conditions.push(`plan_zip IN (${zips.map((z) => `'${z}'`).join(", ")})`);

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = `ORDER BY ${sortF} ${sortO}`;
    const query = `SELECT * FROM csv_rows ${whereClause} ${orderClause};`;

    if (onQueryChange) onQueryChange(query);
    return query;
  };

  // emit initial query on mount
  React.useEffect(() => {
    generateQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSliderChange = (event, value) => {
    setMinIndex(value);
    generateQuery(value, selectedZips, sortField, sortOrder);
  };

  const handleZipChange = (event) => {
    const value = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
    setSelectedZips(value);
    generateQuery(minIndex, value, sortField, sortOrder);
  };

  const handleSortFieldChange = (event) => {
    const field = event.target.value;
    setSortField(field);
    generateQuery(minIndex, selectedZips, field, sortOrder);
  };

  const handleSortOrderChange = (event) => {
    const order = event.target.value;
    setSortOrder(order);
    generateQuery(minIndex, selectedZips, sortField, order);
  };

  const handleDownload = async () => {
    const query = generateQuery(minIndex, selectedZips, sortField, sortOrder);

    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql: query }),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filtered_data.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        maxWidth: 900,
        mx: "auto",
        borderRadius: 3,
        backgroundColor: "grey.50",
      }}
    >
      <Typography variant="h6" gutterBottom textAlign="center" fontWeight={600}>
        Build your query
      </Typography>

      {/* CSS Grid: 1 column on xs, 2 columns on sm+ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* ZIP Selector (grid cell 1) */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Filter by ZIP Codes</Typography>
          <FormControl fullWidth>
            <InputLabel id="zip-select-label">ZIP Codes</InputLabel>
            <Select
              labelId="zip-select-label"
              multiple
              value={selectedZips}
              onChange={handleZipChange}
              input={<OutlinedInput label="ZIP Codes" />}
              renderValue={(selected) => selected.join(", ")}
            >
              {zipOptions.map((zip) => (
                <MenuItem key={zip} value={zip}>
                  {zip}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Risk Factor Slider (grid cell 2) */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Minimum Risk Factor</Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={minIndex}
              min={0}
              max={20}
              step={1}
              marks
              valueLabelDisplay="on"
              onChange={handleSliderChange}
            />
          </Box>
        </Box>

        {/* Sort Field (grid cell 3) */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Sort Field</Typography>
          <FormControl fullWidth>
            <InputLabel id="sort-field-label">Sort Field</InputLabel>
            <Select
              labelId="sort-field-label"
              value={sortField}
              onChange={handleSortFieldChange}
            >
              <MenuItem value="payer">Payer</MenuItem>
              <MenuItem value="risk_factor">Risk Factor</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Sort Order (grid cell 4) */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Sort Order</Typography>
          <FormControl fullWidth>
            <InputLabel id="sort-order-label">Sort Order</InputLabel>
            <Select
              labelId="sort-order-label"
              value={sortOrder}
              onChange={handleSortOrderChange}
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Download button centered */}
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Button variant="contained" color="primary" onClick={handleDownload}>
          Download CSV
        </Button>
      </Box>
    </Paper>
  );
}
