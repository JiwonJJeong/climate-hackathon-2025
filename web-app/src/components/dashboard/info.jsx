// MyComponent.js
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const Information = ({ title, onClick }) => {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5">{title}</Typography>
      <Button variant="contained" color="primary" onClick={onClick}>
        Click me
      </Button>
    </Box>
  );
};

export default Information;
