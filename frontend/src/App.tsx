import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingLayout } from './layouts/LandingLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminRoute } from './auth/AdminRoute';

// Public Landing Pages
import { LandingPage } from './pages/landing/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { VerifyCertificate } from './pages/public/VerifyCertificate';

// Private App Pages
import { SingleAnalysis } from './pages/app/SingleAnalysis';
import { BulkAnalysis } from './pages/app/BulkAnalysis';
import { History } from './pages/app/History';
import { Analytics } from './pages/app/Analytics';
import { Datasets } from './pages/app/Datasets';
import { ModelTraining } from './pages/app/ModelTraining';
import { AdminDashboard } from './pages/app/AdminDashboard';
import { Profile } from './pages/app/Profile';
import { Forbidden } from './pages/app/Forbidden';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* 1. PUBLIC ROUTES (Navbar with public links) */}
              <Route element={<LandingLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/verify/:id" element={<VerifyCertificate />} />
              </Route>

              {/* 2. AUTHENTICATION ROUTES (2-column layout, Navbar hidden) */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* 2. PRIVATE APP ROUTES (Sidebar shell, login required) */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/single" replace />} />
                <Route path="single" element={<SingleAnalysis />} />
                <Route path="bulk" element={<BulkAnalysis />} />
                <Route path="history" element={<History />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="profile" element={<Profile />} />

                {/* Admin Only Routes */}
                <Route
                  path="datasets"
                  element={
                    <AdminRoute>
                      <Datasets />
                    </AdminRoute>
                  }
                />
                <Route
                  path="models"
                  element={
                    <AdminRoute>
                      <ModelTraining />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                {/* Access Restricted Page */}
                <Route path="forbidden" element={<Forbidden />} />
              </Route>

              {/* Backwards Compatibility Redirects */}
              <Route path="/analyze" element={<Navigate to="/app/single" replace />} />
              <Route path="/bulk" element={<Navigate to="/app/bulk" replace />} />
              <Route path="/history" element={<Navigate to="/app/history" replace />} />
              <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
              <Route path="/datasets" element={<Navigate to="/app/datasets" replace />} />
              <Route path="/models" element={<Navigate to="/app/models" replace />} />
              <Route path="/admin" element={<Navigate to="/app/admin" replace />} />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
