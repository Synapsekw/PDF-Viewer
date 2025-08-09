import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { AuthPage } from './components/auth';
import AppShell from './layout/AppShell';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider } from './theme/ThemeProvider';

// Lazy load heavy components for better performance
const PDFViewerApp = lazy(() => import('./PDFViewerApp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const User = lazy(() => import('./pages/User'));
const Library = lazy(() => import('./pages/Library'));
const Reports = lazy(() => import('./pages/Reports'));
const PublicLandingRoute = lazy(() => import('./features/publicViewer/PublicLanding'));
const PublicViewerRoute = lazy(() => import('./features/publicViewer/PublicViewer'));

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
      <p className="text-slate-400">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AnalyticsProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
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
              <Route path="/user" element={
                <AppShell>
                  <User />
                </AppShell>
              } />
              <Route path="/library" element={
                <AppShell>
                  <Library />
                </AppShell>
              } />
              <Route path="/reports" element={
                <AppShell>
                  <Reports />
                </AppShell>
              } />
              {/* Public routes - no AppShell wrapper */}
              <Route path="/s/:token" element={<PublicLandingRoute />} />
              <Route path="/v/:token" element={<PublicViewerRoute />} />
              <Route path="/test" element={<div style={{padding: '20px', background: 'green', color: 'white'}}>Test Route Working!</div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AnalyticsProvider>
    </ThemeProvider>
  );
};

export default App;