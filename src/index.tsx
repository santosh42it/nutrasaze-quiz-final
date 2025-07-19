import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { QuizScreen } from "./screens/QuizScreen";
import { AdminPanel } from "./components/admin/AdminPanel";
import { AdminLogin } from "./components/admin/AdminLogin";

// Global error handlers to prevent console spam
window.addEventListener('unhandledrejection', (event) => {
  // Only log meaningful errors, suppress network connection errors during development
  if (event.reason && !event.reason.message?.includes('ERR_CONNECTION_REFUSED')) {
    console.warn('Unhandled promise rejection prevented:', event.reason);
  }
  event.preventDefault(); // Prevent the default behavior
});

window.addEventListener('error', (event) => {
  // Only log meaningful errors
  if (event.error && !event.error.message?.includes('ERR_CONNECTION_REFUSED')) {
    console.warn('Global error caught:', event.error);
  }
});

// Add connection check on startup
const checkConnection = async () => {
  try {
    const response = await fetch(window.location.origin, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('✅ Connection check passed');
  } catch (error) {
    console.warn('⚠️ Connection check failed:', error);
  }
};

checkConnection();
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { createAdminUser } from "./lib/supabase";

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

// Create admin user on application start
createAdminUser().catch((error) => {
  console.warn('Admin user setup warning:', error);
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