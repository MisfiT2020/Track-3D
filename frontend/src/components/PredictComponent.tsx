import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PredictComponent: React.FC = () => {
  const [progressReport, setProgressReport] = useState('');
  const [prediction, setPrediction] = useState('');
  const [error, setError] = useState('');

  const handlePredict = async () => {
    setError('');
    setPrediction('');
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, {
        progress_report: progressReport,
      });
      setPrediction(response.data.prediction);
    } catch (err: any) {
      console.error(err);
      setError("Failed to get prediction.");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Predict Project Completion
      </Typography>
      <TextField
        label="Construction Progress Report"
        multiline
        rows={4}
        value={progressReport}
        onChange={(e) => setProgressReport(e.target.value)}
        fullWidth
        variant="outlined"
      />
      <Button variant="contained" onClick={handlePredict} sx={{ mt: 2 }}>
        Get Prediction
      </Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {prediction && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Prediction: {prediction}
        </Alert>
      )}
    </Box>
  );
};

export default PredictComponent;
