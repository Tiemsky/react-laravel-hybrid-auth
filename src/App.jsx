// src/App.jsx
import { useAuth }       from "./hooks/useAuth";
import LoginPage         from "./pages/LoginPage";
import DashboardPage     from "./pages/DashboardPage";
import LoadingScreen     from "./components/ui/LoadingScreen";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  return user ? <DashboardPage /> : <LoginPage />;
}
