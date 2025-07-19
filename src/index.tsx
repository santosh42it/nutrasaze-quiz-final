
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { QuizScreen } from "./screens/QuizScreen";
import { AdminPanel } from "./components/admin/AdminPanel";
import { AdminLogin } from "./components/admin/AdminLogin";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { createAdminUser } from "./lib/supabase";

// Comprehensive error suppression for development environment
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a network-related error
  const reason = event.reason;
  const errorMessage = reason?.message || String(reason) || '';
  const errorStack = reason?.stack || '';
  
  // Suppress all network and connection errors
  if (
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('WebSocket connection') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('Supabase not configured') ||
    errorStack.includes('supabase') ||
    errorStack.includes('fetch') ||
    String(reason).includes('ERR_CONNECTION_REFUSED')
  ) {
    event.preventDefault();
    return;
  }
  
  // Only log non-network errors
  if (errorMessage && !errorMessage.includes('connection')) {
    console.warn('Unhandled promise rejection:', event.reason);
  }
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  const errorMessage = event.error?.message || '';
  const errorStack = event.error?.stack || '';
  
  // Suppress all network and connection errors
  if (
    errorMessage.includes('ERR_CONNECTION_REFUSED') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('WebSocket connection') ||
    errorMessage.includes('NetworkError') ||
    errorStack.includes('supabase') ||
    errorStack.includes('fetch')
  ) {
    event.preventDefault();
    return;
  }
  
  // Only log meaningful errors
  if (errorMessage && !errorMessage.includes('connection')) {
    console.warn('Global error:', event.error);
  }
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
