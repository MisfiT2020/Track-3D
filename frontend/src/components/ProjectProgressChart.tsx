import React from 'react';
import { Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';

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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineController, LineElement, PointElement);

interface ProjectData {
  days_elapsed: number;
  planned_progress: number;
  actual_progress: number;
}

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

export default ProjectProgressChart;
