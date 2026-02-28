// src/components/ui/LoadingScreen.jsx
export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-hex" aria-hidden="true" />
      <span className="loading-text">Vérification session...</span>
    </div>
  );
}
