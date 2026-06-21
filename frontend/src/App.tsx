import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ChatComponent from './components/Chat';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3', // modern blue
    },
    secondary: {
      main: '#00e5ff', // cyan
    },
    background: {
      default: '#0a0a0f', // premium dark background
      paper: '#121218',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Inter", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatComponent />
    </ThemeProvider>
  );
}

export default App;

