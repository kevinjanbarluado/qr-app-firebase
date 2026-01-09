import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLogin from './components/AdminLogin';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboard from './components/AdminDashboard';
import ProfileSetup from './components/ProfileSetup';
import UserDashboard from './components/UserDashboard';
import UserDetails from './components/UserDetails';
import './App.css';

// Inner component that uses auth context
function AppRoutes() {
  const { isAdminLoggedIn, isAdmin, logout } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAdminLoggedIn ?
            <Navigate to="/dashboard" replace /> :
            <AdminLogin />
        }
      />
      <Route
        path="/login"
        element={
          isAdminLoggedIn ?
            <Navigate to="/dashboard" replace /> :
            <AdminLogin />
        }
      />
      <Route
        path="/dashboard"
        element={
          isAdminLoggedIn ?
            <UserDashboard /> :
            <Navigate to="/login" replace />
        }
      />
      <Route
        path="/profile"
        element={
          isAdminLoggedIn ?
            <ProfileSetup /> :
            <Navigate to="/login" replace />
        }
      />
      <Route
        path="/admin-login"
        element={
          isAdmin ?
            <Navigate to="/admin" replace /> :
            isAdminLoggedIn ?
              <Navigate to="/dashboard" replace /> :
              <AdminLoginPage />
        }
      />
      <Route
        path="/admin"
        element={
          isAdmin ?
            <AdminDashboard onLogout={logout} /> :
            isAdminLoggedIn ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/admin-login" replace />
        }
      />
      <Route
        path="/user-details"
        element={
          isAdmin ?
            <UserDetails /> :
            isAdminLoggedIn ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/admin-login" replace />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;