import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import {
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  Fab,
  Collapse,
  Tooltip
} from '@mui/material';

import ReactMarkdown from 'react-markdown';
import ProjectProgressChart from '../components/ProjectProgressChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface RecentImport {
  prediction: string;
  chart_data: Array<{
    days_elapsed: number;
    planned_progress: number;
    actual_progress: number;
  }>;
  created_at: string;
}

const RecentImportsPage: React.FC = () => {
  const [imports, setImports] = useState<RecentImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentImports = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      try {
        const response = await axios.get('/recent-imports', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setImports(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch recent imports');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentImports();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Recent Imports
      </Typography>
      
      {imports.length === 0 ? (
        <Typography variant="body1">No recent imports found</Typography>
      ) : (
        imports.map((importEntry, index) => (
          <Card key={index} sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Date: {new Date(importEntry.created_at).toLocaleString()}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <ProjectProgressChart projects={importEntry.chart_data} />
              </Box>

              <Typography variant="h5" gutterBottom>
                AI Prediction:
              </Typography>
              <Typography variant="body1">
                <ReactMarkdown>{importEntry.prediction}</ReactMarkdown>
              </Typography>
            </CardContent>
          </Card>
        ))
      )}

      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 16 },
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Fab
          color="primary"
          onClick={() => setNavOpen(!navOpen)}
          sx={{ mb: 1 }}
          aria-label="Toggle navigation"
        >
          {navOpen ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
        </Fab>
        
        <Collapse in={navOpen}>
          <Box
            sx={{
              mt: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 2,
              p: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <Tooltip title="Dashboard" placement="left" arrow>
              <Fab
                sx={{ background: 'linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)' }}
                onClick={() => navigate('/dashboard')}
                aria-label="dashboard"
              >
                <DashboardIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </Fab>
            </Tooltip>
            <Tooltip title="Change Password" placement="left" arrow>
              <Fab
                sx={{ background: 'linear-gradient(45deg, #FF9800 0%, #FFC107 100%)' }}
                onClick={() => navigate('/change-password')}
                aria-label="change password"
              >
                <LockIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </Fab>
            </Tooltip>
            <Tooltip title="Logout" placement="left" arrow>
              <Fab
                sx={{ background: 'linear-gradient(45deg, #F44336 0%, #E91E63 100%)' }}
                onClick={handleLogout}
                aria-label="logout"
              >
                <LogoutIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </Fab>
            </Tooltip>
          </Box>
        </Collapse>
      </Box>
    </Container>
  );
};

export default RecentImportsPage;
