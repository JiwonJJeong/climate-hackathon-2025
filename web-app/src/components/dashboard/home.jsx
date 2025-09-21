// MyComponent.js
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Input from "../texti.jsx"
import {useState} from 'react'

const PersonalInput = ({ title, onClick }) => {
  const [zcode, setZcode] = useState();

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5">{title}</Typography>
      <Input
        label='FIP Code'
        onChange={(e)=> setZcode(e.target.value)}
        placeholder='Enter FIP location Code'
        ></Input>
      <Button variant="contained" color="primary" onClick={onClick}>
        Click me
      </Button>
    </Box>
  );
};

export default PersonalInput;
