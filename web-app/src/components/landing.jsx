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

const HeroSection = () => (
  <Box
    sx={{
      height: '80vh',
      backgroundColor: 'primary.main',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      px: 3,
      pt: '80px', // padding top for external header
    }}
  >
    <Typography variant="h2" component="h1" gutterBottom>
      Welcome to MyCompany
    </Typography>
    <Typography variant="h5" paragraph>
      We build awesome stuff that solves problems.
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
      <Button
        component={Link}
        to="/insurance"
        variant="contained"
        color="secondary"
        size="large"
      >
        Get Started (Insurance)
      </Button>
      <Button
        component={Link}
        to="/individuals"
        variant="contained"
        color="secondary"
        size="large"
      >
        Get Startd (Individuals)
        </Button>
    </Box>
  </Box>
);


const features = [
  {
    title: 'Fast Performance',
    description: 'Our product is optimized for speed and reliability.',
  },
  {
    title: 'Secure',
    description: 'Top-notch security ensures your data is safe with us.',
  },
  {
    title: 'Easy to Use',
    description: 'User-friendly interfaces for everyone.',
  },
];

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
    <CssBaseline />
    {/* Add margin-top to push whole page content down */}
    <Box mt="80px">  
      <main>
        <HeroSection />
      </main>
      <Footer />
    </Box>
  </>
);


export default LandingPage;
