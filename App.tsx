import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailySubmit } from './pages/DailySubmit';
import { TeamReports } from './pages/TeamReports';
import { Summary } from './pages/Summary';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';
import { api } from './services/mockBackend';
import { UserRole } from './types';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = api.auth.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = api.auth.getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/submit" element={
          <PrivateRoute>
            <DailySubmit />
          </PrivateRoute>
        } />

        {/* Admin Routes */}
        <Route path="/reports" element={
          <PrivateRoute>
            <TeamReports />
          </PrivateRoute>
        } />
        
        <Route path="/summary" element={
          <AdminRoute>
            <Summary />
          </AdminRoute>
        } />

        <Route path="/settings" element={
             <PrivateRoute>
                 <Settings />
             </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
