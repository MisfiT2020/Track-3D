import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Fab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface User {
  userid: number;
  username: string;
  is_sudo: boolean;
}


const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/admin-panel-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setError('Unexpected data format received.');
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Session expired, please login again.');
        navigate('/');
      } else {
        setError('Failed to fetch users.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsAdmin(user.is_sudo);
    setUpdateError('');
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !selectedUser) return;
    setUpdateLoading(true);
    setUpdateError('');
    try {
      const response = await axios.put(
        `/admin-panel`,
        {
          userid: selectedUser.userid,
          new_password: newPassword,
          is_admin: isAdmin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('User updated:', response.data);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        setUpdateError('Session expired, please login again.');
        navigate('/');
      } else {
        setUpdateError('Error updating user.');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (userid: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    try {
      await axios.delete(`/admin-panel/${userid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        navigate('/');
      } else {
      }
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      {/* Back button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 16 },
          zIndex: 1300,
        }}
      >
        <Fab
          color="primary"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to Dashboard"
        >
          <ArrowBackIcon />
        </Fab>
      </Box>
      
      <Typography variant="h4" gutterBottom>
        Manage Users
      </Typography>

      {/* Loading and error states */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : users.length === 0 ? (
        <Typography>No users found.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.userid} style={{ cursor: 'pointer' }}>
                <TableCell onClick={() => handleUserClick(user)}>
                  {user.userid}
                </TableCell>
                <TableCell onClick={() => handleUserClick(user)}>
                  {user.username}
                </TableCell>
                <TableCell onClick={() => handleUserClick(user)}>
                  {user.is_sudo ? 'Admin' : 'Member'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDelete(user.userid)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Update user dialog */}
      {selectedUser && (
        <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
          <DialogTitle>Update User: {selectedUser.username}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
              }
              label="Admin Access"
            />
            {updateError && <Alert severity="error">{updateError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default AdminPanel;
