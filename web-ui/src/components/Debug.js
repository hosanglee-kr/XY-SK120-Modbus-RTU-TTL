import React, { useState, useEffect } from 'react';
import api from '../api';
import { Box, Button, Typography, Paper, Stack, Alert } from '@mui/material';

const Debug = () => {
  const [pingResult, setPingResult] = useState(null);
  const [statusResult, setStatusResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handlePing = async () => {
    setPingResult('Loading...');
    setError(null);
    const result = await api.ping();
    setPingResult(JSON.stringify(result, null, 2));
    if (!result.success) {
      setError('Ping failed. Check that the ESP32 has the correct API endpoints configured.');
    }
  };
  
  const handleStatus = async () => {
    setStatusResult('Loading...');
    setError(null);
    const result = await api.getStatus();
    setStatusResult(JSON.stringify(result, null, 2));
    if (!result.success) {
      setError('Status API failed. Check that the ESP32 has the correct API endpoints configured.');
    }
  };

  useEffect(() => {
    // Detect if we're running from ESP32 or dev environment
    const isEsp32Host = window.location.hostname !== 'localhost' && 
                       !window.location.hostname.includes('127.0.0.1');
    
    if (isEsp32Host) {
      console.log('Running on ESP32 host. API calls will go to the same origin.');
    } else {
      console.warn('Running in development mode. API calls may fail due to CORS or different backend URL.');
    }
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 2, my: 2 }}>
      <Typography variant="h6">Debug Interface</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      <Stack direction="row" spacing={2} sx={{ my: 2 }}>
        <Button variant="contained" onClick={handlePing}>
          Test API Connection
        </Button>
        <Button variant="outlined" onClick={handleStatus}>
          Get System Status
        </Button>
      </Stack>
      
      {pingResult && (
        <Box mt={2}>
          <Typography variant="subtitle2">Ping Response:</Typography>
          <Box component="pre" sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 1, 
            borderRadius: 1,
            overflowX: 'auto'
          }}>
            {pingResult}
          </Box>
        </Box>
      )}
      
      {statusResult && (
        <Box mt={2}>
          <Typography variant="subtitle2">Status Response:</Typography>
          <Box component="pre" sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 1, 
            borderRadius: 1,
            overflowX: 'auto'
          }}>
            {statusResult}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Debug;
