import React, { useEffect, useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useSessionExpired from '../hooks/useSessionExpired';
import { ProtectedData, RecentImport, ProjectData } from '../types/dashboardTypes';
import {
  fetchProtectedData,
  fetchRecentImports,
  fetchAdminUsers,
  uploadCSVFile,
} from '../services/dashboardService';
import {
  Typography,
  Avatar,
  Box,
  Container,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Fab,
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  LineElement,
  PointElement,
  LineController,
} from 'chart.js';
import { keyframes } from '@mui/system';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  LineElement,
  PointElement,
  LineController
);

interface ProjectProgressChartProps {
  projects: ProjectData[];
}

const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({ projects }) => {
  if (projects.length === 0) {
    return <Typography align="center">No chart data available.</Typography>;
  }
  const labels = projects.map((project) => `Day ${project.days_elapsed}`);
  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Actual Progress',
        data: projects.map((project) => project.actual_progress),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        type: 'line' as const,
        label: 'Planned Progress',
        data: projects.map((project) => project.planned_progress),
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: { y: { beginAtZero: true, max: 100 } },
  };
  return <Bar data={chartData as any} options={options} />;
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const popup = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); }
`;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Dashboard: React.FC = () => {
  const [data, setData] = useState<ProtectedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [recentImport, setRecentImport] = useState<RecentImport | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState<string>('/static/images/avatar/1.jpg');
  const [csvImportStage, setCsvImportStage] = useState<string>('');
  const [sessionExpired, setSessionExpired] = useSessionExpired();

  const [logoutDialogOpen, setLogoutDialogOpen] = useState<boolean>(false);

  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditDialogOpen, setAuditDialogOpen] = useState<boolean>(false);

  const handleAuditLogsClick = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const logs = await response.json();
        setAuditLogs(logs);
        setAuditDialogOpen(true);
      } else {
        console.error('Error fetching audit logs:', response.status);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };
  
  
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('is_sudo');
    setLogoutDialogOpen(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  useEffect(() => {
    const loadProtectedData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
  
      try {
        const response = await fetchProtectedData(token);
        setData(response.data);
        if (response.data.profile_pic) {
          setProfilePic(response.data.profile_pic);
        }
      } catch (err: any) {
        console.error('fetching data err:', err.response?.data);
        if (err.response?.data?.detail === 'Invalid token') {
          window.dispatchEvent(new Event('sessionExpired'));
        }
        setError('Failed to fetch protected data.');
      } finally {
        setLoading(false);
      }
    };
    loadProtectedData();
  }, [navigate]);

  useEffect(() => {
    const loadRecentImports = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await fetchRecentImports(token);
        if (response.data && response.data.length > 0) {
          const latestImport = response.data.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          setRecentImport(latestImport);
        }
      } catch (err: any) {
        console.error('fetching recent import err:', err.response?.data || err);
      }
    };
    loadRecentImports();
  }, []);

  useEffect(() => {
    const loadAdminUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token || !data?.is_sudo) return;
  
      try {
        const response = await fetchAdminUsers(token);
        setTotalUsers(response.data.length);
      } catch (err: any) {
        console.error('fetching users err:', err.response?.data || err);
      }
    };
    loadAdminUsers();
  }, [data]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError('');
      setUploadSuccess('');
      setCsvImportStage('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
  
    const stages = ["Generating", "Fetching", "Wrapping"];
    let stageIndex = 0;
    setCsvImportStage(stages[stageIndex]);
    const intervalId = setInterval(() => {
      stageIndex = (stageIndex + 1) % stages.length;
      setCsvImportStage(stages[stageIndex]);
    }, 1500);
  
    try {
      const csvText = await readFileAsText(selectedFile);
      const response = await uploadCSVFile(token, selectedFile);
      clearInterval(intervalId);
      navigate('/import-report', {
        state: { prediction: response.data.prediction, csvData: csvText },
      });
    } catch (err: any) {
      clearInterval(intervalId);
      console.error('processing CSV err:', err.response?.data || err);
      setUploadError('Failed to process CSV file.');
    }
  };

  return (
    <Box>
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
              background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(245,245,255,0.9) 100%)',
              borderRadius: 2,
              p: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              maxHeight: '208px',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            <Tooltip title="Profile" placement="left" arrow>
              <Fab
                sx={{
                  flexShrink: 0,
                  background: 'transparent',
                  boxShadow: 'none',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: 'none',
                  },
                }}
                onClick={() => navigate('/profile')}
                aria-label="profile"
              >
                <Avatar
                  src={profilePic}
                  sx={{
                    width: 40,
                    height: 40,
                  }}
                />
              </Fab>
            </Tooltip>
            <Tooltip title="Dashboard" placement="left" arrow>
              <Fab
                sx={{
                  flexShrink: 0,
                  background: 'linear-gradient(45deg, #2196F3 0%, #21CBF3 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1) rotate(8deg)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  },
                }}
                onClick={() => navigate('/dashboard')}
                aria-label="dashboard"
              >
                <DashboardIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </Fab>
            </Tooltip>
            <Tooltip title="Change Password" placement="left" arrow>
              <Fab
                sx={{
                  flexShrink: 0,
                  background: 'linear-gradient(45deg, #FF9800 0%, #FFC107 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  },
                }}
                onClick={() => navigate('/changepassword')}
                aria-label="change password"
              >
                <LockIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </Fab>
            </Tooltip>
            <Tooltip title="Logout" placement="left" arrow>
              <Fab
                sx={{
                  flexShrink: 0,
                  background: 'linear-gradient(45deg, #F44336 0%, #E91E63 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  },
                }}
                onClick={handleLogoutClick}
                aria-label="logout"
              >
                <LogoutIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </Fab>
            </Tooltip>
          </Box>
        </Collapse>
      </Box>

      <Container sx={{ mt: 4, mb: { xs: 8, md: 4 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            <Card sx={{ maxWidth: 400, p: 2, animation: `${popup} 0.5s ease-out` }}>
              <CardContent>
                {error && <Alert severity="error">{error}</Alert>}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Avatar alt="Profile" src={`${profilePic}?t=${new Date().getTime()}`} sx={{ width: 80, height: 80 }} />
                </Box>
                <Typography variant="h5" gutterBottom>
                  Welcome, {data.username}!
                </Typography>
                <Typography variant="body1">User ID: {data.userid}</Typography>
                <Typography variant="body1">
                  User Type: {data.is_sudo ? 'Admin' : 'Member'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Button onClick={handleLogoutClick} variant="contained">
                    Logout
                  </Button>
                  <Button onClick={handleProfile} variant="outlined">
                    Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {data.is_sudo && (
              <Card
  sx={{
    maxWidth: 400,
    p: 2,
    animation: `${popup} 0.5s ease-out`,
    background: 'white',
    border: '1px solid #e0e0e0',
    position: 'relative',
    overflow: 'visible',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    },
  }}
>
  <Box
    sx={{
      position: 'absolute',
      top: -12,
      right: -12,
      bgcolor: 'rgba(103,58,183,0.9)',
      width: 48,
      height: 48,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}
  >
    <SecurityIcon sx={{ color: 'white', fontSize: 28 }} />
  </Box>
  <CardContent>
    <Typography
      variant="h5"
      gutterBottom
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        color: 'primary.main',
        fontWeight: 600,
        mb: 3,
      }}
    >
      Admin Dashboard
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 2,
        mb: 3,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: '#f5f5f5',
          border: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          Total Users
        </Typography>
        <Typography variant="h4" sx={{ color: 'secondary.main' }}>
          {totalUsers}
        </Typography>
      </Box>
    </Box>

    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Button
        onClick={() => navigate('/sudo-panel')}
        variant="contained"
        fullWidth
        startIcon={<SecurityIcon />}
      >
        Users
      </Button>
      <Button
        onClick={handleAuditLogsClick}
        variant="outlined"
        fullWidth
        startIcon={<HistoryIcon />}
      >
        Audit Logs
      </Button>
    </Box>
  </CardContent>
</Card>

            )}

            <Card sx={{ maxWidth: 400, p: 2, animation: `${popup} 0.5s ease-out` }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Import CSV Data
                </Typography>
                {csvImportStage ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '190px'
                    }}
                  >
                    <CircularProgress size={24} sx={{ mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Processing CSV - {csvImportStage}...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      Upload your project progress CSV to generate predictions.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <label htmlFor="csv-upload">
                        <input
                          type="file"
                          accept=".csv"
                          hidden
                          id="csv-upload"
                          onChange={handleFileChange}
                        />
                        <Box
                          sx={{
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body1">
                            {selectedFile ? selectedFile.name : 'Click to select file'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedFile ? 'File ready for upload' : 'Supports .csv only'}
                          </Typography>
                        </Box>
                      </label>

                      {selectedFile && (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            bgcolor: 'success.light',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <CheckCircleIcon sx={{ color: 'success.main' }} />
                          <Typography variant="body2">
                            {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                          </Typography>
                        </Box>
                      )}

                      <Button
                        variant="contained"
                        onClick={handleFileUpload}
                        disabled={!selectedFile}
                        fullWidth
                        sx={{ mt: 1 }}
                        startIcon={<SendIcon />}
                      >
                        Analyze CSV
                      </Button>

                      {uploadError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {uploadError}
                        </Alert>
                      )}
                      {uploadSuccess && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          {uploadSuccess}
                        </Alert>
                      )}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                maxWidth: 400,
                p: 2,
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
                background: 'linear-gradient(145deg, rgba(245,255,245,0.9) 0%, rgba(235,255,240,0.9) 100%)',
                animation: `${popup} 0.5s ease-out`
              }}
              onClick={() => navigate('/recents')}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: 350,
                  pb: { xs: 8, md: 2 }
                }}
              >
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon fontSize="medium" />
                    Recents
                  </Typography>
                  {recentImport && recentImport.chart_data ? (
                    <>
                      <Typography variant="body2">
                        Imported on: {new Date(recentImport.created_at).toLocaleString()}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 2,
                          width: '100%'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(75, 192, 192, 1)'
                            }}
                          />
                          <Typography variant="subtitle2">Actual Progress</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255, 99, 132, 1)'
                            }}
                          />
                          <Typography variant="subtitle2">Planned Progress</Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2">No recent import graph available.</Typography>
                  )}
                </Box>
                {recentImport && recentImport.chart_data && (
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', mt: 2 }}>
                    <ProjectProgressChart projects={recentImport.chart_data} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography>No data available.</Typography>
            <Button variant="outlined" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        )}
      </Container>

      <Dialog
  open={auditDialogOpen}
  onClose={() => setAuditDialogOpen(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>Audit Logs</DialogTitle>
  <DialogContent dividers>
    {auditLogs.length > 0 ? (
      <Box
        component="pre"
        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {auditLogs.join('\n')}
      </Box>
    ) : (
      <Typography>No audit logs available.</Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setAuditDialogOpen(false)}>Close</Button>
  </DialogActions>
</Dialog>


      <Dialog open={sessionExpired} onClose={() => setSessionExpired(false)}>
        <DialogTitle>Session Expired</DialogTitle>
        <DialogContent>Your session has expired. Please log in again.</DialogContent>
        <DialogActions>
        <Button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userid');
            localStorage.removeItem('is_sudo');
            setSessionExpired(false);
            navigate('/');
          }}
          color="primary"
        >
          Login Again
        </Button>
        
        </DialogActions>
      </Dialog>

      <Dialog open={logoutDialogOpen} onClose={cancelLogout}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelLogout}>Cancel</Button>
          <Button onClick={confirmLogout} color="primary">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
