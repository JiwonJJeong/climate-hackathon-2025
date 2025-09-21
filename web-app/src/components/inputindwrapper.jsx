import React, { useRef } from "react";
import { Box, Button, Paper, Typography, Divider } from "@mui/material";
import HealthForm from "./individual-page/inputindividual.jsx"

export default function PageLayoutI() {
  const mainRef = useRef(null);
  const infoRef = useRef(null);
  const extraRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const headerHeight = 64; // height of the top header
  const sidebarWidth = 200;
  const mainCardHeight = "70vh"; // fixed height

  return (
    <Box display="flex" height={`calc(100vh - ${headerHeight}px)`} mt={`${headerHeight}px`}>
      {/* Sidebar */}
      <Box
        width={sidebarWidth}
        bgcolor="primary.main"
        color="white"
        p={2}
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
      >
        <Typography variant="h6" gutterBottom>
          Navigation
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => scrollTo(mainRef)}
          sx={{ mb: 1 }}
        >
          Main Content
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => scrollTo(infoRef)}
          sx={{ mb: 1 }}
        >
          More Information
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => scrollTo(extraRef)}
          sx={{ mb: 1 }}
        >
          Extra Info
        </Button>
      </Box>

      {/* Main content */}
      <Box
        flex={1}
        p={2}
        display="block"
        overflow="auto"
      >
        {/* Scrollable container with fixed height */}
        <Paper
          ref={mainRef}
          elevation={3}
          sx={{
            height: mainCardHeight,
            overflowY: "scroll",
            p: 2,
            mb: 4,
          }}
        >
          <HealthForm/>
        </Paper>

        <Divider sx={{ mb: 2 }} />

        {/* More information section */}
        <Box ref={infoRef} sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            More Information
          </Typography>
          <Typography>
            This section is below the main card. Clicking the sidebar button
            scrolls here smoothly.
          </Typography>
        </Box>

        {/* Extra info section */}
        <Box ref={extraRef}>
          <Typography variant="h5" gutterBottom>
            Extra Information
          </Typography>
          <Typography>
            This is the third section. The sidebar button navigates here as
            well.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
