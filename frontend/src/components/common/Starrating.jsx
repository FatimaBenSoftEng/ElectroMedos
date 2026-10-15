import styles from './StarRating.module.css';

const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const stars = [0, 1, 2, 3, 4].map((i) => <Star key={i} />);

/**
 * Étoiles d'avis. Gère les notes décimales (ex. 4.3).
 * <StarRating rating={4.5} count={24} />
 */
export default function StarRating({ rating = 0, count, size = 14 }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div className={styles.rating} aria-label={`Note : ${value.toFixed(1)} sur 5`}>
      <span className={styles.stars} style={{ '--star-size': `${size}px` }}>
        <span className={styles.row}>{stars}</span>
        <span className={`${styles.row} ${styles.filled}`} style={{ width: `${(value / 5) * 100}%` }}>
          {stars}
        </span>
      </span>
      {count != null && <span className={styles.count}>({count})</span>}
    </div>
  );
}