
import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./index.css";
import { ContentScreen } from "./screens/ContentScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { AdminPanel } from "./components/admin/AdminPanel";
import { AdminLogin } from "./components/admin/AdminLogin";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { createAdminUser } from "./lib/supabase";
import { ResultsPage } from "./components/Quiz/ResultsPage";
import { pageview } from "./lib/analytics";
import ErrorBoundary from "./components/ErrorBoundary";

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection (handled):', event.reason);
  
  // Prevent the default unhandled rejection behavior to stop console spam
  event.preventDefault();
  
  // Check if it's a critical error that should crash the app
  if (event.reason && typeof event.reason === 'object') {
    const error = event.reason as any;
    if (error.message && error.message.includes('ChunkLoadError')) {
      // Critical chunk loading error - reload the page
      console.error('Critical chunk load error detected, reloading...');
      window.location.reload();
      return;
    }
  }
});

// Handle other errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Create admin user on application start
createAdminUser().catch((error) => {
  console.error('Failed to create admin user:', error);
});

// Component to track page views
const PageTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      pageview(location.pathname + location.search);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [location]);

  return null;
};

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <PageTracker />
        <Routes>
          <Route path="/" element={<QuizScreen />} />
          <Route path="/content" element={<ContentScreen onNavigateToQuiz={() => window.location.href = '/'} />} />
          <Route path="/quiz" element={<QuizScreen />} />
          <Route path="/results/:resultId" element={<ResultsPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          {/* Catch-all route - redirect unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
