import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';

const RegisterComplete = () => {
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.registerStepThree(user.email, password, {
        country_id: country,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la complétion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Complétez votre inscription</h2>
        <p>Bienvenue {user?.prenom} ! Quelques informations pour finaliser.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Créez un mot de passe"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>Pays</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            >
              <option value="">Sélectionner un pays</option>
              <option value="1">Sénégal</option>
              <option value="2">Côte d'Ivoire</option>
              <option value="3">France</option>
              {/* Ajoute tes pays ici */}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'En cours...' : 'Terminer l\'inscription'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterComplete;
