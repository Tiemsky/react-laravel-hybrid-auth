import { Routes, Route } from 'react-router-dom';
import Login from './pages/LoginPage';
import RegisterComplete from './pages/auth/RegisterComplete';
import AuthCallback from './components/auth/AuthCallback';
import Dashboard from './pages/Dashboard';  // ✅ Import ajouté
import { ProtectedRoute } from './contexts/AuthContext';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Routes protégées */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />  {/* ✅ Dashboard protégé */}
        </ProtectedRoute>
      } />

      <Route path="/register/complete" element={
        <ProtectedRoute requireComplete={false}>
          <RegisterComplete />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;
