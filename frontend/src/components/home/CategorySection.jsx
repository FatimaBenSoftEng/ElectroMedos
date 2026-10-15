import { Link } from 'react-router-dom';
import { getCategoryImage } from '../../utils/productHelpers';
import styles from './CategorySection.module.css';

export default function CategorySection({ categories = [] }) {
  if (!categories.length) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2>Catégories</h2>
          <p>Explorez nos univers high-tech</p>
        </div>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className={styles.card}
            >
              <img src={getCategoryImage(cat.slug)} alt="" loading="lazy" />
              <div className={styles.overlay}>
                <h3>{cat.name}</h3>
                <span>{cat.product_count ?? 0} produits</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
