// PageWrapper.js
import { Container } from "@mui/material";

const PageWrapper = ({ children }) => {
  return (
    <Container maxWidth="lg" sx={{ mt: 10 }}> 
      {children}
    </Container>
  );
};

export default PageWrapper;
