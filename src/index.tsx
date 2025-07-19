
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { QuizScreen } from "./screens/QuizScreen";
import { AdminPanel } from "./components/admin/AdminPanel";
import { AdminLogin } from "./components/admin/AdminLogin";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { createAdminUser } from "./lib/supabase";

// Single set of global error handlers
window.addEventListener('unhandledrejection', (event) => {
  // Suppress known development errors to reduce console spam
  const errorMessage = event.reason?.message || '';
  if (
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('WebSocket connection') ||
    errorMessage.includes('Supabase not configured')
  ) {
    event.preventDefault();
    return;
  }
  
  // Log meaningful errors only
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  // Suppress known development errors
  const errorMessage = event.error?.message || '';
  if (
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('WebSocket connection')
  ) {
    return;
  }
  
  // Log meaningful errors only
  console.warn('Global error:', event.error);
});

// Create admin user on application start (with error suppression)
createAdminUser().catch((error) => {
  // Only log if it's not a known configuration issue
  if (!error?.message?.includes('Supabase not configured')) {
    console.warn('Admin user setup warning:', error);
  }
});

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuizScreen />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
