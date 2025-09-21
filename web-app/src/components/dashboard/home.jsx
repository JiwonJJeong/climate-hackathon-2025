import React from 'react';
import { Container, Typography, Box, Divider } from '@mui/material';
import LaptopPng from '../../assets/laptop.png'

const InfoPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 12, mb: 8 }}>
      <Typography variant="h3" gutterBottom>
        Protecting Communities from Air Pollution
      </Typography>

      <Typography variant="body1" paragraph>
        Over 8 million people die every year from cardiac and respiratory events caused by air pollution. 
        Our team of researchers came together to answer the question–how can we do better to protect the most vulnerable people in our communities?
      </Typography>

      <Typography variant="body1" paragraph>
        We created a first-of-its-kind predictive AI dashboard that fuses individual health profiles 
        with real-time environmental exposures to forecast hospitalization risk from stroke, cardiac arrest, or respiratory failure.
      </Typography>

      <Box
  component="img"
  src={LaptopPng}
  alt="Laptop dashboard"
  sx={{ width: '100%', maxWidth: 700, mt: 4, mb: 4, borderRadius: 2 }}
/>


      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        How It Works
      </Typography>

      <Typography variant="body1" paragraph>
        In order to reach the most vulnerable populations with clean air solutions, we need to pinpoint who they are first. 
        Our tool uses dual layer-modeling to link patient-level comorbidities with local air quality and heat data based on the zip code a patient lives in.
      </Typography>

      <Typography variant="body1" paragraph>
        After identifying people who are most at risk for cardiac or respiratory emergencies when exposed to dirty air, 
        the dashboard engages patients in proactive prevention by triggering timely, tailored outreach and resource delivery 
        of HEPA air purifiers, N95 masks, and information about local cooling centers where neighbors can shelter during an air pollution event.
      </Typography>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Scalable Impact
      </Typography>

      <Typography variant="body1" paragraph>
        Finally, this tool has scalable impact– it transforms real-time climate data into actionable clinical insights 
        for insurers and employers. Stakeholders are financially incentivized to reduce avoidable emergency department admissions, 
        and patients are able to protect themselves and their communities from preventable illness. It’s a win-win.
      </Typography>
    </Container>
  );
};

export default InfoPage;

