import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Skeleton';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, loading, columns = 4 }) {
  if (loading) {
    return (
      <div className={styles.grid} style={{ '--columns': columns }}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return <p className={styles.empty}>Aucun produit trouvé.</p>;
  }

  return (
    <div className={styles.grid} style={{ '--columns': columns }}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
