import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
} from '@mui/material';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController,
} from 'chart.js';

import ReactMarkdown from 'react-markdown';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, LineController);

export interface ProjectData {
  project_id: number;
  progress_percent: number;
  materials_used: number;
  workforce: number;
  days_elapsed: number;
  days_remaining: number;
}

const ProjectProgressChart: React.FC<{ projects: ProjectData[] }> = ({ projects }) => {
  if (projects.length === 0) {
    return <Typography align="center">No project data available to display chart.</Typography>;
  }

  const totalProgress = projects.reduce((sum, project) => sum + project.progress_percent, 0);
  const averageProgress = totalProgress / projects.length;
  const labels = projects.map((project) => `Project ${project.project_id}`);
  
  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Progress Percent',
        data: projects.map((project) => project.progress_percent),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        type: 'line' as const,
        label: 'Average Progress',
        data: projects.map(() => averageProgress),
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

const ImportReport: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = (location.state || {}) as { prediction?: string; csvData?: string };
  let prediction = stateData.prediction || '';
  let csvData = stateData.csvData || '';

  if (!prediction || !csvData) {
    const persistedData = localStorage.getItem('importReportData');
    if (persistedData) {
      const parsedData = JSON.parse(persistedData);
      prediction = parsedData.prediction;
      csvData = parsedData.csvData;
    }
  } else {
    localStorage.setItem('importReportData', JSON.stringify({ prediction, csvData }));
  }

  useEffect(() => {
    if (!prediction || !csvData) {
      navigate('/');
    }
  }, [prediction, csvData, navigate]);

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showResults, setShowResults] = useState<boolean>(false);

  useEffect(() => {
    // Parse the CSV immediately without delay
    Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      complete: (results: any) => {
        const projectsData: ProjectData[] = results.data.map((row: any) => ({
          project_id: row.project_id,
          progress_percent: row.progress_percent,
          materials_used: row.materials_used,
          workforce: row.workforce,
          days_elapsed: row.days_elapsed,
          days_remaining: row.days_remaining,
        }));
        setProjects(projectsData);
        setLoading(false);
        setShowResults(true);
      },
      error: (error: any) => {
        console.error('Parsing CSV error:', error);
        setLoading(false);
      },
    });
  }, [csvData]);

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Import Report
      </Typography>
      <Card sx={{ p: 2, mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            AI Generated Insights
          </Typography>
          <ReactMarkdown>{prediction}</ReactMarkdown>
        </CardContent>
      </Card>

      {(loading || !showResults) ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress sx={{ mb: 2 }} />
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" align="center" gutterBottom>
            Project Progress Chart
          </Typography>
          <ProjectProgressChart projects={projects} />
        </Box>
      )}

      <Box sx={{ mt: 4, textAlign: 'center', mb: 4 }}>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default ImportReport;
