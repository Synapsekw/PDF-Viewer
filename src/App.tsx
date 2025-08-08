import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import PDFViewerApp from './PDFViewerApp';
import { AuthPage } from './components/auth';
import Dashboard from './pages/Dashboard';
import AppShell from './layout/AppShell';

const App: React.FC = () => {
  console.log('App component rendering');
  
  return (
    <div>
      {/* EMERGENCY DEBUG - Should be visible on any route */}
      <div style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '200px',
        height: '50px',
        backgroundColor: 'red',
        color: 'white',
        zIndex: 9999,
        fontSize: '16px',
        padding: '10px',
        border: '5px solid yellow'
      }}>
        EMERGENCY DEBUG: App is rendering
      </div>
      
      <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={
          <AppShell>
            <Dashboard />
          </AppShell>
        } />
        <Route path="/app" element={
          <AppShell>
            <PDFViewerApp />
          </AppShell>
        } />
        <Route path="/test" element={<div style={{padding: '20px', background: 'green', color: 'white'}}>Test Route Working!</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </div>
  );
};

export default App;