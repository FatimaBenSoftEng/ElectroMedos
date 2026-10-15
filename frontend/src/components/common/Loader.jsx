export function Loader({ size = 'md', fullPage = false }) {
  const className = `loader loader--${size}${fullPage ? ' loader--full' : ''}`;

  return (
    <div className={className} role="status" aria-label="Chargement">
      <div className="loader__spinner" />
    </div>
  );
}