// src/components/ui/ErrorBanner.jsx
export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </div>
  );
}
