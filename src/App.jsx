// src/App.jsx
// Router simple — pas de react-router, détection par pathname

import { useAuth }           from "./hooks/useAuth";
import LoginPage             from "./pages/LoginPage";
import DashboardPage         from "./pages/DashboardPage";
import GoogleCallbackPage    from "./pages/GoogleCallbackPage";
import LoadingScreen         from "./components/ui/LoadingScreen";

export default function App() {
  const { user, loading } = useAuth();
  const path = window.location.pathname;

  // ✅ Route callback Google — accessible même sans être connecté
  // React reçoit ?code=xxx et échange contre les tokens
  if (path === "/auth/google/callback") {
    return <GoogleCallbackPage />;
  }

  if (loading) return <LoadingScreen />;

  return user ? <DashboardPage /> : <LoginPage />;
}
