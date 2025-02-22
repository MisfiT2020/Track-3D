import React, { useState, useCallback } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuthRedirect from '../hooks/useAuthRedirect';

import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Snackbar,
  InputAdornment,
  IconButton,
} from '@mui/material';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login: React.FC = () => {
  useAuthRedirect();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.state?.accountCreated) setShowSuccess(true);
  }, [location.state]);

  const handleCloseSnackbar = () => {
    setShowSuccess(false);
    setSessionExpired(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password } = formData;

    if (!username.trim() || !password.trim()) {
      setError('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        '/login',
        new URLSearchParams(formData),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('userid', response.data.userid.toString());

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Invalid credentials, please try again.');
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
          autoComplete="on"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 4,
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" align="center">
            Login
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            variant="outlined"
            autoComplete="username"
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            variant="outlined"
            autoComplete="current-password"
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
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
          <Typography variant="body2" align="center">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/signup" underline="hover">
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Container>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Account created successfully! Please log in.
        </Alert>
      </Snackbar>

      <Snackbar
        open={sessionExpired}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: 80 }} 
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          Session expired, please login again.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
