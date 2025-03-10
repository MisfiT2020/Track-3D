import {
  Box,
  Avatar,
  Button,
  Typography,
  Alert,
  TextField,
  Card,
  CardContent,
  Grid,
  IconButton,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import React, { useState, useEffect, ChangeEvent } from 'react';
import { CameraAlt, LockReset, Logout } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string>('/static/images/avatar/1.jpg');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [uploadPicError, setUploadPicError] = useState<string>('');
  const [uploadPicSuccess, setUploadPicSuccess] = useState<string>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState<string>('');
  const [usernameSuccess, setUsernameSuccess] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      try {
        const response = await axios.get('/protected', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
        if (response.data.profile_pic) {
          setProfilePic(response.data.profile_pic + '?t=' + new Date().getTime());
        }
      } catch (err) {
        console.error('Fetching profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setUploadPicError('File size should be less than 5MB');
        return;
      }
      setProfilePicFile(file);
      setProfilePic(URL.createObjectURL(file));
      setUploadPicError('');
      setUploadPicSuccess('');
      setUploadDialogOpen(true);
    }
  };

  const handleProfilePicUpload = async () => {
    if (!profilePicFile) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('profile_pic', profilePicFile);
      await axios.post('/upload-profile-pic', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadPicSuccess('Profile picture updated successfully');
      setUploadDialogOpen(false);
      setTimeout(() => setUploadPicSuccess(''), 3000);
    } catch (err: any) {
      setUploadPicError(err.response?.data.detail || 'Upload failed');
      setUploadDialogOpen(false);
    }
  };

  const cancelProfilePicUpload = () => {
    setProfilePicFile(null);
    setProfilePic(data?.profile_pic || '/static/images/avatar/1.jpg');
    setUploadDialogOpen(false);
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim() || newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');
    try {
      const response = await axios.put(
        '/change-username',
        { new_username: newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsernameSuccess('Username updated successfully to ' + response.data.username);
      setData({ ...data, username: response.data.username });
      setTimeout(() => setUsernameSuccess(''), 3000);
    } catch (err: any) {
      setUsernameError(err.response?.data.detail || 'Update failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card
      sx={{
        maxWidth: 800,
        mx: { xs: 2, md: 'auto' },
        mt: 4,
        mb: { xs: 4, md: 8 },
        px: { xs: 2, md: 3 },
        p: 3,
        position: 'relative',
      }}
    >
      <IconButton
        onClick={handleBack}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1,
        }}
        aria-label="Back"
      >
        <ArrowBackIcon />
      </IconButton>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ position: 'relative', mb: 3 }}>
            <Avatar
              alt="Profile"
              src={profilePic}
              sx={{
                width: 120,
                height: 120,
                border: '3px solid',
                borderColor: 'primary.main',
              }}
            />
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper',
              }}
            >
              <CameraAlt />
              <input type="file" hidden accept="image/*" onChange={handleProfilePicChange} />
            </IconButton>
          </Box>

          <Typography variant="h4" gutterBottom sx={{ mb: 6 }}>
            {data?.username || 'User'}
          </Typography>


          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Email:</strong> {data?.email || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Joined:</strong> {data?.joined_date ? new Date(data.joined_date).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Role:</strong> {data?.role || 'Member'}
              </Typography>
            </Grid>
          </Grid>

          <Dialog open={uploadDialogOpen} onClose={cancelProfilePicUpload}>
            <DialogTitle>Profile Picture</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to upload this new profile picture?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelProfilePicUpload}>Cancel</Button>
              <Button onClick={handleProfilePicUpload} color="primary">
                Upload
              </Button>
            </DialogActions>
          </Dialog>

          <Divider sx={{ width: '100%', mb: 3 }} />

          <Box sx={{ width: '100%', maxWidth: 400, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Username
            </Typography>
            <TextField
              fullWidth
              label="New Username"
              variant="outlined"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setUsernameError('');
              }}
              error={!!usernameError}
              helperText={usernameError}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={handleChangeUsername} fullWidth disabled={!newUsername.trim()}>
              Update Username
            </Button>
            {usernameSuccess && <Alert severity="success" sx={{ mt: 2 }}>{usernameSuccess}</Alert>}
          </Box>

          <Divider sx={{ width: '100%', mb: 3 }} />

          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LockReset />}
              sx={{ mb: 2 }}
              onClick={() => navigate('/change-password')}
            >
              Change Password
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </CardContent>

      {uploadPicSuccess && (
        <Alert severity="success" sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          {uploadPicSuccess}
        </Alert>
      )}
      {uploadPicError && (
        <Alert severity="error" sx={{ position: 'fixed', bottom: 20, right: 20 }}>
          {uploadPicError}
        </Alert>
      )}
    </Card>
  );
};

export default Profile;
