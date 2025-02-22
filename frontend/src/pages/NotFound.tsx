import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';

const NotFound: React.FC = () => {
  return (
    <Container sx={{ textAlign: 'center', mt: 10 }}>
      <Typography variant="h3" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" gutterBottom>
        Oops! The page you're looking for does not exist.
      </Typography>
      <Box mt={4}>
        <Button variant="contained" component={Link} to="/">
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
