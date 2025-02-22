import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post('/signup', { username, email, password });
      navigate('/', { state: { accountCreated: true } });
    } catch (err: any) {
      console.error(err);
      setError('Signup failed. The username may already be taken.');
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh', 
      }}
    >
      <Container maxWidth="xs">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" align="center">
            Sign Up
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            variant="outlined"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="outlined"
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleToggleConfirmPasswordVisibility} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
          </Button>
          <Typography variant="body2" align="center">
            Already have an account?{' '}
            <Link component={RouterLink} to="/" underline="hover">
              Login
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;
