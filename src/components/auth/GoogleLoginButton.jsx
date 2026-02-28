import React, { useEffect, useRef } from 'react';
import { GoogleAuth } from '../../utils/google-auth';
import { apiConfig } from '../../config/api.config';

const GoogleLoginButton = ({ disabled = false }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    GoogleAuth.loadSdk().then(() => {
      if (isInitialized.current) return;

      const handleCredentialResponse = (response) => {
        // Flow redirect pour le web (géré par backend)
        window.location.href = `${apiConfig.baseURL}/auth/google/login?frontend_url=${encodeURIComponent(apiConfig.frontendUrl)}`;
      };

      GoogleAuth.init(import.meta.env.VITE_GOOGLE_CLIENT_ID, handleCredentialResponse);
      isInitialized.current = true;
    });
  }, []);

  return (
    <div className="google-login-wrapper">
      <div id="google-btn" className={`google-btn-container ${disabled ? 'disabled' : ''}`} />
      <noscript>
        <a
          href={`${apiConfig.baseURL}/auth/google/login?frontend_url=${encodeURIComponent(apiConfig.frontendUrl)}`}
          className="google-fallback-link"
        >
          Continuer avec Google
        </a>
      </noscript>
    </div>
  );
};

export default GoogleLoginButton;
