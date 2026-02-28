// src/components/ui/Spinner.jsx
export default function Spinner({ size = 18, color = "var(--black)" }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderTopColor: color }}
      role="status"
      aria-label="Chargement..."
    />
  );
}
