export function Skeleton({ width = '100%', height = '1rem', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card--skeleton">
      <Skeleton height="180px" className="skeleton--rounded" />
      <Skeleton height="1.25rem" width="70%" />
      <Skeleton height="1rem" width="40%" />
      <Skeleton height="2rem" width="50%" />
    </div>
  );
}
