import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useWishlist } from '../context/WishlistContext';
import ProductGrid from '../components/products/ProductGrid';
import styles from './WishlistPage.module.css';

export default function WishlistPage() {
  const { items } = useWishlist();
  const { notify } = useNotification();
  const [products, setProducts] = useState(items);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!items.length) {
      setProducts([]);
      return;
    }
    setLoading(true);
    Promise.all(items.map((item) => productService.getProduct(item.slug).catch(() => null)))
      .then((results) => {
        setProducts(results.filter(Boolean).map((r) => r.data));
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [items, notify]);

  return (
    <div className={`container page ${styles.page}`}>
      <h1 className="page__title">Mes favoris</h1>
      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Votre liste de favoris est vide.</p>
          <Link to="/products" className="btn btn--primary">Découvrir la boutique</Link>
        </div>
      ) : (
        <ProductGrid products={products} loading={loading} />
      )}
    </div>
  );
}
