import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, TextField, Button, Card, 
  CardContent, Grid, Switch, FormControlLabel, AppBar,
  Toolbar, CircularProgress, ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import Debug from './components/Debug';

function App() {
  // Create dark theme
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9', // Slightly lighter blue for dark mode
      },
      secondary: {
        main: '#f48fb1',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
  });

  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    outputEnabled: false,
    protectionStatus: false,
    temperature: 0
  });
  
  const [settings, setSettings] = useState({
    voltage: '',
    current: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchData();
    
    // Set up EventSource for real-time updates
    const eventSource = new EventSource('/events');
    
    eventSource.addEventListener('readings', (event) => {
      setData(JSON.parse(event.data));
      setLoading(false);
      setConnected(true);
    });
    
    eventSource.onopen = () => {
      setConnected(true);
    };
    
    eventSource.onerror = () => {
      setConnected(false);
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSetVoltage = async () => {
    try {
      console.log(`Setting voltage to: ${settings.voltage}V`);
      
      const response = await fetch(`/api/voltage?value=${settings.voltage}`, { method: 'POST' });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Set voltage response:", result);
        
        if (!result.success) {
          console.warn("Failed to set voltage on hardware");
        }
      } else {
        console.error("Error setting voltage");
      }
      
      // Always fetch current data
      fetchData();
    } catch (error) {
      console.error('Error setting voltage:', error);
      fetchData();
    }
  };

  const handleSetCurrent = async () => {
    try {
      console.log(`Setting current to: ${settings.current}A`);
      
      const response = await fetch(`/api/current?value=${settings.current}`, { method: 'POST' });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Set current response:", result);
        
        if (!result.success) {
          console.warn("Failed to set current on hardware");
        }
      } else {
        console.error("Error setting current");
      }
      
      // Always fetch current data
      fetchData();
    } catch (error) {
      console.error('Error setting current:', error);
      fetchData();
    }
  };

  const handleToggleOutput = async () => {
    try {
      const newState = !data.outputEnabled;
      
      console.log(`Toggle output to: ${newState ? 'ON' : 'OFF'}`);
      
      // Optimistically update UI for better responsiveness
      setData(prevData => ({
        ...prevData,
        outputEnabled: newState
      }));
      
      // Call API to update the server
      const response = await fetch(`/api/output?state=${newState ? '1' : '0'}`, { 
        method: 'POST' 
      });
      
      // Check the response
      if (response.ok) {
        const result = await response.json();
        console.log("Toggle output response:", result);
        
        // If hardware state is different from requested, update UI
        if (result.state !== newState) {
          console.warn(`Server state (${result.state}) differs from expected (${newState}), updating UI`);
          setData(prevData => ({
            ...prevData,
            outputEnabled: result.state === true
          }));
        }
        
        if (!result.success) {
          console.warn("Failed to set output state on hardware");
          fetchData(); // Fetch current state if operation didn't succeed
        }
      } else {
        console.error("Error toggling output");
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling output:', error);
      fetchData();
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Normalizes CSS and applies theme background */}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              XY-SK120 DPS Control Panel
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: connected ? 'success.main' : 'error.main',
                mr: 1 
              }} />
              <Typography variant="body2">
                {connected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Current Readings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="h6" color="primary">{data.voltage.toFixed(2)}V</Typography>
                      <Typography variant="body2" color="text.secondary">Voltage</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h6" color="primary">{data.current.toFixed(2)}A</Typography>
                      <Typography variant="body2" color="text.secondary">Current</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h6" color="primary">{data.power.toFixed(2)}W</Typography>
                      <Typography variant="body2" color="text.secondary">Power</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        Temperature: {data.temperature}°C
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={data.outputEnabled} 
                            onChange={handleToggleOutput}
                            color="primary"
                          />
                        }
                        label="Output"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography 
                        color={data.protectionStatus ? "error" : "success"} 
                        variant="body1"
                      >
                        Protection: {data.protectionStatus ? "Active" : "Inactive"}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Set Voltage (V)"
                        type="number"
                        value={settings.voltage}
                        onChange={(e) => setSettings({...settings, voltage: e.target.value})}
                        fullWidth
                        margin="normal"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                      />
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSetVoltage}
                        disabled={!settings.voltage}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Apply
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Set Current (A)"
                        type="number"
                        value={settings.current}
                        onChange={(e) => setSettings({...settings, current: e.target.value})}
                        fullWidth
                        margin="normal"
                        InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                      />
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSetCurrent}
                        disabled={!settings.current}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Apply
                      </Button>
                    </Grid>
                  </Grid>
                  
                  <Button
                    variant="contained"
                    color={data.outputEnabled ? "success" : "error"}
                    startIcon={<PowerSettingsNewIcon />}
                    onClick={handleToggleOutput}
                    fullWidth
                    sx={{ 
                      mt: 2,
                      backgroundColor: data.outputEnabled ? undefined : '#d32f2f',
                      '&:hover': {
                        backgroundColor: data.outputEnabled ? undefined : '#aa2424',
                      }
                    }}
                  >
                    {data.outputEnabled ? "Output ON" : "Output OFF"}
                  </Button>
                </CardContent>
              </Card>
              
              <Debug />
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
