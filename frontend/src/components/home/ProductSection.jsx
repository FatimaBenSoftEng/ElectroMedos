import { Link } from 'react-router-dom';
import ProductGrid from '../products/ProductGrid';
import styles from './ProductSection.module.css';

export default function ProductSection({
  eyebrow, // optionnel : petit texte en majuscules, ex. "Nos produits"
  title,
  subtitle,
  products = [],
  loading = false,
  viewAllLink,
  variant = 'default',
}) {
  return (
    <section className={`${styles.section} ${variant === 'alt' ? styles.alt : ''}`}>
      <div className="container">
        <div className={styles.header}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <ProductGrid products={products} loading={loading} />

        {viewAllLink && (
          <div className={styles.footer}>
            <Link to={viewAllLink} className={styles.viewAll}>
              Voir tout
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}