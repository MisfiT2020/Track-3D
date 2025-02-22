//import React from 'react';
//import { useLocation, useNavigate } from 'react-router-dom';
//import { Bar } from 'react-chartjs-2';
//
//import {
//  Box,
//  Container,
//  Typography,
//  Card,
//  CardContent,
//  Button,
//} from '@mui/material';
//
//import {
//  Chart as ChartJS,
//  CategoryScale,
//  LinearScale,
//  BarElement,
//  Title,
//  Tooltip,
//  Legend,
//  LineElement,
//  PointElement,
//  LineController,
//} from 'chart.js';
//
//ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineController, LineElement, PointElement);
//
//interface RecentImport {
//  id: number;
//  prediction: string;
//  chart_data: { days_elapsed: number; planned_progress: number; actual_progress: number }[];
//  created_at: string;
//}
//
//const RecentDetail: React.FC = () => {
//  const location = useLocation();
//  const navigate = useNavigate();
//  const recent: RecentImport | undefined = location.state?.recent;
//
//  if (!recent) {
//    navigate('/recents');
//    return null;
//  }
//
//  const ProjectProgressChart: React.FC<{ projects: RecentImport['chart_data'] }> = ({ projects }) => {
//    if (projects.length === 0) {
//      return <Typography align="center">No chart data available.</Typography>;
//    }
//    const labels = projects.map((project) => `Day ${project.days_elapsed}`);
//    const chartData = {
//      labels,
//      datasets: [
//        {
//          type: 'bar' as const,
//          label: 'Actual Progress',
//          data: projects.map((project) => project.actual_progress),
//          backgroundColor: 'rgba(75, 192, 192, 0.6)',
//          borderColor: 'rgba(75, 192, 192, 1)',
//          borderWidth: 1,
//        },
//        {
//          type: 'line' as const,
//          label: 'Planned Progress',
//          data: projects.map((project) => project.planned_progress),
//          borderColor: 'rgba(255, 99, 132, 1)',
//          borderWidth: 2,
//          fill: false,
//          tension: 0.1,
//        },
//      ],
//    };
//    const options = {
//      responsive: true,
//      plugins: {
//        legend: { display: true },
//        title: { display: true, text: 'Project Progress Chart' },
//      },
//      scales: { y: { beginAtZero: true, max: 100 } },
//    };
//    return <Bar data={chartData as any} options={options} />;
//  };
//
//  return (
//    <Container sx={{ mt: 4 }}>
//      <Typography variant="h4" gutterBottom>
//        Recent Import Detail
//      </Typography>
//      <Card sx={{ p: 2, mb: 4 }}>
//        <CardContent>
//          <Typography variant="h5" gutterBottom>
//            AI Generated Insights
//          </Typography>
//          <Typography variant="body1">{recent.prediction}</Typography>
//          <Typography variant="body2" sx={{ mt: 1 }}>
//            Imported on: {new Date(recent.created_at).toLocaleString()}
//          </Typography>
//        </CardContent>
//      </Card>
//      <Box sx={{ mb: 4 }}>
//        <Typography variant="h5" align="center" gutterBottom>
//          Project Progress Chart
//        </Typography>
//        <ProjectProgressChart projects={recent.chart_data} />
//      </Box>
//      <Box sx={{ mt: 4, textAlign: 'center' }}>
//        <Button variant="contained" onClick={() => navigate('/recents')}>
//          Back to Recent Imports
//        </Button>
//      </Box>
//    </Container>
//  );
//};
//
//export default RecentDetail;
//