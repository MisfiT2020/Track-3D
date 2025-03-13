import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { useLocation, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';

import ReactMarkdown from 'react-markdown';

import ProjectProgressChart from '../components/ProjectProgressChart';

export interface ProjectData {
  project_id: number;
  progress_percent: number;
  materials_used: number;
  workforce: number;
  days_elapsed: number;
  days_remaining: number;
}

const ImportReport: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

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
    Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      complete: (results: any) => {
        const projectsData: ProjectData[] = results.data
          .filter((row: any) => row.project_id != null)  
          .map((row: any) => ({
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

  const exportPDF = () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const width = element.scrollWidth;
    const height = element.scrollHeight;

    const options = {
      margin: 0,
      filename: 'report.pdf',
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: 'px', format: [width, height], orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    html2pdf().from(element).set(options).save();
  };

  const chartData = projects.map((project) => {
    const totalDays = project.days_elapsed + project.days_remaining;
    return {
      days_elapsed: project.days_elapsed,
      actual_progress: project.progress_percent,
      planned_progress: totalDays > 0 ? (project.days_elapsed / totalDays) * 100 : 0,
    };
  });

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <div ref={reportRef}>
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '300px',
            }}
          >
            <CircularProgress sx={{ mb: 2 }} />
          </Box>
        ) : (
          <Box
            className="chart-page"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%',
              mx: 'auto',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Project Progress Chart (Actual vs Planned)
            </Typography>
            <ProjectProgressChart projects={chartData} />
          </Box>
        )}
      </div>

      <Box
        sx={{
          mt: 4,
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button variant="contained" onClick={exportPDF} sx={{ ml: 3.5 }}>
          Export
        </Button>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default ImportReport;
