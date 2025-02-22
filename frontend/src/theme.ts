import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6750A4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
    },
    background: {
      default: '#F2F2F2',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Open Sans'
  },
  shape: {
  borderRadius: 20, 
},
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0px 8px 16px rgba(0,0,0,0.2)',
          },
        },
      },
    },
  },
});

export default theme;
