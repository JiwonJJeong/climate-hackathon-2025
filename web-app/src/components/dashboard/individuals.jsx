import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Grid, 
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import axios from 'axios';

const IndividualsPage = () => {
  const [formData, setFormData] = useState({
    age: 45,
    aqi: 150,
    diabetes: false,
    hypertension: false,
    heart_disease: false
  });
  
  const [riskResult, setRiskResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const calculateRisk = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        age: formData.age,
        aqi: formData.aqi,
        diabetes: formData.diabetes ? 1 : 0,
        hypertension: formData.hypertension ? 1 : 0,
        heart_disease: formData.heart_disease ? 1 : 0
      };
      
      const response = await axios.get('http://localhost:2003/api/compute_risk', { params });
      setRiskResult(response.data);
    } catch (err) {
      setError('Failed to calculate risk. Please try again.');
      console.error('Error calculating risk:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk < 25) return '#4caf50'; // Green
    if (risk < 50) return '#ff9800'; // Orange
    if (risk < 75) return '#f44336'; // Red
    return '#9c27b0'; // Purple for very high risk
  };

  const getRiskLevel = (risk) => {
    if (risk < 25) return 'Low Risk';
    if (risk < 50) return 'Moderate Risk';
    if (risk < 75) return 'High Risk';
    return 'Very High Risk';
  };

  return (
    <Box sx={{ padding: 4, maxWidth: 800, margin: '0 auto', mt: 8 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Climate Health Risk Assessment
      </Typography>
      
      <Paper elevation={3} sx={{ padding: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Enter Your Health Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
              InputProps={{ inputProps: { min: 0, max: 120 } }}
              helperText="Your current age"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Air Quality Index (AQI)"
              type="number"
              value={formData.aqi}
              onChange={(e) => handleInputChange('aqi', parseInt(e.target.value) || 0)}
              InputProps={{ inputProps: { min: 0, max: 500 } }}
              helperText="Current AQI in your area (0-500)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Pre-existing Conditions
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.diabetes}
                  onChange={handleSwitchChange('diabetes')}
                  color="primary"
                />
              }
              label="Diabetes"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hypertension}
                  onChange={handleSwitchChange('hypertension')}
                  color="primary"
                />
              }
              label="Hypertension"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.heart_disease}
                  onChange={handleSwitchChange('heart_disease')}
                  color="primary"
                />
              }
              label="Heart Disease"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={calculateRisk}
            disabled={loading}
            sx={{
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#115293',
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'See My Climate Risk'}
          </Button>
        </Box>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {riskResult && (
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h6" gutterBottom align="center">
            Your Climate Health Risk Assessment
          </Typography>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                color: getRiskColor(riskResult.risk_percentage),
                fontWeight: 'bold',
                mb: 1
              }}
            >
              {riskResult.risk_percentage}%
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: getRiskColor(riskResult.risk_percentage),
                fontWeight: 'medium'
              }}
            >
              {getRiskLevel(riskResult.risk_percentage)}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Assessment based on:
            </Typography>
            <Typography variant="body2">
              • Age: {riskResult.inputs.age} years
            </Typography>
            <Typography variant="body2">
              • Air Quality Index: {riskResult.inputs.aqi}
            </Typography>
            <Typography variant="body2">
              • Diabetes: {riskResult.inputs.diabetes ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2">
              • Hypertension: {riskResult.inputs.hypertension ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2">
              • Heart Disease: {riskResult.inputs.heart_disease ? 'Yes' : 'No'}
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            This assessment is for informational purposes only and should not replace professional medical advice. 
            Please consult with your healthcare provider for personalized guidance.
          </Alert>
        </Paper>
      )}
    </Box>
  );
};

export default IndividualsPage;
