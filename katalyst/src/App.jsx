import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './Authentication/Login';
import ReportsPage from './Components/Reports/ReportsPage';
import Dashboard from './DashboardFiles/Dashboard';
import DashboardLayout from './Components/DashboardLayout';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const hasToken = !!sessionStorage.getItem('authToken');
  
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const hasToken = !!sessionStorage.getItem('authToken');
  
  if (hasToken) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const App = () => {
  const [hasToken, setHasToken] = useState(!!sessionStorage.getItem('authToken'));
  useEffect(() => {
    const checkAuth = () => {
      const tokenExists = !!sessionStorage.getItem('authToken');
      setHasToken(tokenExists);
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ReportsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports/:reportId" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ReportsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            hasToken 
              ? <Navigate to="/dashboard" replace /> 
              : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="*" 
          element={
            hasToken 
              ? <Navigate to="/dashboard" replace /> 
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
};

export default App;