// TextInput.js
import React from 'react';
import TextField from '@mui/material/TextField';

const TextInput = ({ label, value, onChange, placeholder }) => {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="outlined"
      fullWidth
    />
  );
};

export default TextInput;
