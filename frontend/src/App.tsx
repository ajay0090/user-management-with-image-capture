import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { User } from './types';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import themeOptions from './theme';

const theme = createTheme(themeOptions);

function App() {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  const [token, setToken] = useState(savedToken ?? '');
  const [user, setUser] = useState<User | null>(savedUser ? JSON.parse(savedUser) : null);

  const auth = useMemo(
    () => ({ token, user }),
    [token, user],
  );

  const handleLogin = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route index element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <DashboardPage token={token} user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
