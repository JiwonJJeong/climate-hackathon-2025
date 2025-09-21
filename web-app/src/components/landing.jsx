import React from 'react';
import {
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Paper,
  CssBaseline,
} from '@mui/material';
import {Link} from 'react-router-dom'
import '../fonts.css'

import heroBg from '../assets/maddison-mcmurrin-GDumtPpJsT4-unsplash.jpg';

const HeroSection = () => (
      <Box
    sx={{
      height: '100vh',                      // Full screen
      width: '100%',                        // Full width
      backgroundImage: `url(${heroBg})`,    // Background image
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      color: 'white',
      px: 3,
    }}
  >
<Typography
  variant="h2"
  component="h1"
  gutterBottom
  sx={{ fontFamily: 'OpenSauce, Arial, sans-serif' }}
>
  We all breath air.
</Typography>

<Typography variant="h5">
  Air quality can determine your heart health.
  Are you at risk?
</Typography>

<Typography
  variant="body1" // smaller than h5
  sx={{
    fontFamily: 'sans-serif',
    fontStyle: 'italic',
    fontWeight: 'bold',
    mt: 7, // margin-top to add space
  }}
>
  Find out your air health score here
</Typography>



    {/* Buttons container */}
    <Box
      sx={{
        display: 'flex',
        gap: 2,           // space between buttons
        mt: 3,            // margin top to separate from text
        flexWrap: 'wrap', // wrap buttons on smaller screens
        justifyContent: 'center',
      }}
    >

<Box display="flex" gap={3} flexWrap="wrap" justifyContent="center"> {/* Adjust `gap` as needed */}
  <Button
    component={Link}
    to="/insurance"
    variant="contained"
    size="large"
    sx={{
      backgroundColor: 'white',
      color: 'black',
      borderRadius: '30px',
      textTransform: 'none', // Optional: keeps casing normal
      px: 4, // Optional: extra horizontal padding
      '&:hover': {
        backgroundColor: '#f0f0f0',
      },
    }}
  >
    Insurers
  </Button>

  <Button
    component={Link}
    to="/individuals"
    variant="contained"
    size="large"
    sx={{
      backgroundColor: 'white',
      color: 'black',
      borderRadius: '30px',
      textTransform: 'none',
      px: 4,
      '&:hover': {
        backgroundColor: '#f0f0f0',
      },
    }}
  >
    Individuals
  </Button>

  <Button
    component={Link}
    to="/analysis"
    variant="contained"
    size="large"
    sx={{
      backgroundColor: 'rgba(25, 118, 210, 0.9)',
      color: 'white',
      borderRadius: '30px',
      textTransform: 'none',
      px: 4,
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 1)',
      },
    }}
  >
    📊 View Analysis
  </Button>
</Box>

    </Box>
  </Box>
);


const Footer = () => (
  <Box
    component="footer"
    sx={{
      py: 3,
      px: 2,
      mt: 'auto',
      backgroundColor: (theme) =>
        theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
      textAlign: 'center',
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {'© '}
      <Link color="inherit" href="https://yourcompany.com/">
        MyCompany
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  </Box>
);

const LandingPage = () => (
  <>
    <HeroSection />
  </>
);


export default LandingPage;
