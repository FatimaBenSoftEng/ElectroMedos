import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiHeart, FiShoppingCart } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { useWishlist } from '../../context/WishlistContext';
import { getErrorMessage } from '../../services/api';
import {
  formatPrice,
  getOriginalPrice,
  getProductDiscount,
  isNewProduct,
} from '../../utils/productHelpers';
import ProductQuickView from './ProductQuickView';
import styles from './ProductCard.module.css';

const STARS = [1, 2, 3, 4, 5];

export default function ProductCard({ product, onQuickView }) {
  const [showQuickView, setShowQuickView] = useState(false);
  const [adding, setAdding] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const discount = getProductDiscount(product);
  const originalPrice = getOriginalPrice(product);
  const isNew = isNewProduct(product);
  const inWishlist = isInWishlist(product.id);

  // Avis : adapte ces noms de champs à ton API si besoin
  const rating = Number(product.average_rating ?? product.rating ?? 0) || 0;
  const reviewsCount = Number(product.reviews_count ?? product.review_count ?? 0) || 0;
  const ratingPct = Math.min(100, Math.max(0, (rating / 5) * 100));
  const hasReviews = reviewsCount > 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.slug}` } } });
      return;
    }
    if (product.stock === 0) return;
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      notify('Produit ajouté au panier', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    notify(
      inWishlist ? 'Retiré des favoris' : 'Ajouté aux favoris',
      'success',
    );
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      setShowQuickView(true);
    }
  };

  return (
    <>
      <article className={styles.card}>
        <div className={styles.imageWrap}>
          <Link to={`/products/${product.slug}`} className={styles.imageLink}>
            {product.display_image ? (
              <img src={product.display_image} alt={product.name} loading="lazy" />
            ) : (
              <div className={styles.placeholder}>📦</div>
            )}
          </Link>

          <div className={styles.badges}>
            {discount && <span className={styles.badgeSale}>-{discount}%</span>}
            {isNew && <span className={styles.badgeNew}>Nouveau</span>}
            {product.is_featured && !isNew && (
              <span className={styles.badgeFeatured}>Vedette</span>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${inWishlist ? styles.active : ''}`}
              onClick={handleWishlist}
              aria-label={inWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <FiHeart />
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleQuickView}
              aria-label="Aperçu rapide"
            >
              <FiEye />
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {product.category_name && (
            <span className={styles.category}>{product.category_name}</span>
          )}
          {product.brand && !product.category_name && (
            <span className={styles.category}>{product.brand}</span>
          )}
          <Link to={`/products/${product.slug}`} className={styles.title}>
            {product.name}
          </Link>

          <div
            className={styles.rating}
            role="img"
            aria-label={
              hasReviews
                ? `Note ${rating.toFixed(1)} sur 5, ${reviewsCount} avis`
                : 'Aucun avis pour le moment'
            }
          >
            <span className={styles.stars} aria-hidden="true">
              <span className={styles.starsBase}>
                {STARS.map((n) => <FaStar key={n} />)}
              </span>
              <span className={styles.starsFill} style={{ width: `${ratingPct}%` }}>
                {STARS.map((n) => <FaStar key={n} />)}
              </span>
            </span>
            <span className={styles.reviewCount}>
              {hasReviews
                ? `${rating.toFixed(1)} (${reviewsCount} avis)`
                : 'Aucun avis'}
            </span>
          </div>

          <div className={styles.prices}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {originalPrice && (
              <span className={styles.oldPrice}>{formatPrice(originalPrice)}</span>
            )}
          </div>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
          >
            <FiShoppingCart />
            {product.stock === 0 ? 'Rupture' : adding ? 'Ajout...' : 'Ajouter au panier'}
          </button>
        </div>
      </article>

      {showQuickView && (
        <ProductQuickView product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
}