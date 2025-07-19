
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { QuizScreen } from "./screens/QuizScreen";
import { AdminPanel } from "./components/admin/AdminPanel";
import { AdminLogin } from "./components/admin/AdminLogin";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { createAdminUser } from "./lib/supabase";

// Basic error handling for Supabase configuration issues
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const errorMessage = reason?.message || String(reason) || '';
  
  // Only suppress Supabase configuration errors
  if (errorMessage.includes('Supabase not configured')) {
    event.preventDefault();
    return;
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
