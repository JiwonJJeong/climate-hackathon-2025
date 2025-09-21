// Header.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Header = ({ title }) => {
  return (
    <AppBar position="fixed">
      <Toolbar>
<Typography
  variant="h6"
  component={Link}
  to="/"
  sx={{
    flexGrow: 1,
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex', // <--- This makes the Link a flex item and block-like
    alignItems: 'center', // vertically center if needed
  }}
>
  My Website
</Typography>

        {/* Navigation Links */}
        <Box>
          <Button color="inherit" component={Link} to="/insurance">
            For Insurance
          </Button>
          <Button color="inherit" component={Link} to="/individuals">
            For Individuals
          </Button>
          <Button color="inherit" component={Link} to="/personal">
            Health
          </Button>
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Header;