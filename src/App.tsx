import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { AuthPage } from './components/auth';
import AppShell from './layout/AppShell';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider } from './theme/ThemeProvider';

// Initialize Supabase and repository manager
import { SupabaseClientManager } from './lib/supabase/client';
import { repositoryManager } from './lib/repositories/RepositoryManager';

// Initialize Supabase with project credentials
SupabaseClientManager.initializeWithProject();

// Configure repository manager for Supabase mode
try {
  repositoryManager.initialize();
  console.log('✅ Repository manager initialized for Supabase mode');
} catch (error) {
  console.error('❌ Failed to initialize repository manager:', error);
}

// Lazy load pages for better performance
const PDFViewerApp = lazy(() => import('./PDFViewerApp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Library = lazy(() => import('./pages/Library'));
const Reports = lazy(() => import('./pages/Reports'));
const Admin = lazy(() => import('./pages/Admin'));
const User = lazy(() => import('./pages/User'));

function App() {
  return (
    <ThemeProvider>
      <AnalyticsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/viewer" element={
              <Suspense fallback={<div>Loading PDF Viewer...</div>}>
                <AppShell>
                  <PDFViewerApp />
                </AppShell>
              </Suspense>
            } />
            <Route path="/dashboard" element={
              <Suspense fallback={<div>Loading Dashboard...</div>}>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </Suspense>
            } />
            <Route path="/library" element={
              <Suspense fallback={<div>Loading Library...</div>}>
                <AppShell>
                  <Library />
                </AppShell>
              </Suspense>
            } />
            <Route path="/reports" element={
              <Suspense fallback={<div>Loading Reports...</div>}>
                <AppShell>
                  <Reports />
                </AppShell>
              </Suspense>
            } />
            <Route path="/admin" element={
              <Suspense fallback={<div>Loading Admin...</div>}>
                <AppShell>
                  <Admin />
                </AppShell>
              </Suspense>
            } />
            <Route path="/user" element={
              <Suspense fallback={<div>Loading User Settings...</div>}>
                <AppShell>
                  <User />
                </AppShell>
              </Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AnalyticsProvider>
    </ThemeProvider>
  );
}

export default App;