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
  console.error('Unhandled promise rejection:', event.reason);

  // Check if it's a Supabase related error
  if (event.reason && typeof event.reason === 'object') {
    if (event.reason.message && event.reason.message.includes('supabase')) {
      console.error('Supabase connection issue detected');
    }
  }

  // Don't prevent the error - let it be handled naturally
  // event.preventDefault();
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
    pageview(location.pathname + location.search);
  }, [location]);

  return null;
};

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = React.useState<'content' | 'quiz'>('quiz');

  const navigateToQuiz = () => {
    setCurrentScreen('quiz');
  };

  const navigateToContent = () => {
    setCurrentScreen('content');
  };

  return (
    <>
      {currentScreen === 'content' && <ContentScreen onNavigateToQuiz={navigateToQuiz} />}
      {currentScreen === 'quiz' && <QuizScreen onNavigateToContent={navigateToContent} />}
    </>
  );
};

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <PageTracker />
        <Routes>
          <Route path="/" element={<QuizScreen onNavigateToContent={() => window.location.href = '/content'} />} />
          <Route path="/content" element={<ContentScreen onNavigateToQuiz={() => window.location.href = '/'} />} />
          <Route path="/quiz" element={<QuizScreen onNavigateToContent={() => window.location.href = '/content'} />} />
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