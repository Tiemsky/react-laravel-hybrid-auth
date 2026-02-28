import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { loadUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const accessToken = searchParams.get('token');
        const isNewUser = searchParams.get('new_user') === 'true';
        const error = searchParams.get('error');

        if (error) throw new Error('Échec de l\'authentification Google');
        if (!accessToken) throw new Error('Token manquant');

        const result = await authService.handleGoogleCallback(accessToken);

        if (result.success) {
          setStatus('success');
          await loadUser();

          if (result.requiresCompletion) {
            navigate('/register/complete', { state: { fromGoogle: true, user: result.user } });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          throw new Error(result.error || 'Erreur de récupération du profil');
        }
      } catch (error) {
        console.error('AuthCallback error:', error);
        setStatus('error');
        setMessage(error.message);
        setTimeout(() => navigate('/login?error=google_failed'), 3000);
      }
    };

    handleCallback();
  }, [location, navigate, loadUser]);

  if (status === 'processing') {
    return <div className="auth-callback"><div className="spinner" /><p>Connexion Google...</p></div>;
  }

  if (status === 'success') {
    return <div className="auth-callback success"><p>✓ Connexion réussie !</p></div>;
  }

  return (
    <div className="auth-callback error">
      <p>✕ {message}</p>
      <button onClick={() => navigate('/login')} className="btn-primary">Retour</button>
    </div>
  );
};

export default AuthCallback;
