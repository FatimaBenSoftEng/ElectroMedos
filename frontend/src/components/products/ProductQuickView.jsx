import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { getErrorMessage } from '../../services/api';
import { formatPrice, getOriginalPrice, getProductDiscount } from '../../utils/productHelpers';
import styles from './ProductQuickView.module.css';

export default function ProductQuickView({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const discount = getProductDiscount(product);
  const originalPrice = getOriginalPrice(product);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      onClose();
      navigate('/login', { state: { from: { pathname: `/products/${product.slug}` } } });
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      notify('Produit ajouté au panier', 'success');
      onClose();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
          <FiX />
        </button>

        <div className={styles.grid}>
          <div className={styles.image}>
            {product.display_image ? (
              <img src={product.display_image} alt={product.name} />
            ) : (
              <div className={styles.placeholder}>📦</div>
            )}
          </div>

          <div className={styles.info}>
            {product.brand && <span className={styles.brand}>{product.brand}</span>}
            <h2>{product.name}</h2>
            <div className={styles.prices}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {originalPrice && (
                <span className={styles.oldPrice}>{formatPrice(originalPrice)}</span>
              )}
              {discount && <span className={styles.discount}>-{discount}%</span>}
            </div>
            <p className={styles.desc}>{product.description?.slice(0, 200)}...</p>
            <p className={styles.stock}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
            </p>

            {product.stock > 0 && (
              <div className={styles.actions}>
                <div className={styles.quantity}>
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? 'Ajout...' : 'Ajouter au panier'}
                </button>
              </div>
            )}

            {/* Wrapper pour centrer le bouton */}
            <div className={styles.detailLinkWrapper}>
              <Link to={`/products/${product.slug}`} className={styles.detailLink} onClick={onClose}>
                Voir les détails complets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}