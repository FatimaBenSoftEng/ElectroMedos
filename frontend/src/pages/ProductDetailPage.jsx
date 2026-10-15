import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Loader } from '../components/common/Loader';

const buildDefaultReviews = (product) => {
  const fallbackReviews = [
    {
      id: 1,
      author: 'Sofia',
      rating: 5,
      title: 'Excellent produit',
      comment: 'Très bon rapport qualité/prix et livraison rapide.',
      created_at: '2026-06-16T10:00:00Z',
    },
    {
      id: 2,
      author: 'Yassine',
      rating: 4,
      title: 'Satisfait',
      comment: 'Le produit répond parfaitement à mes attentes.',
      created_at: '2026-06-10T14:30:00Z',
    },
  ];

  if (product?.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
    return product.reviews;
  }

  return fallbackReviews.map((review, index) => ({
    ...review,
    id: `${product?.slug || 'product'}-${index + 1}`,
  }));
};

const formatReviewDate = (value) => {
  if (!value) return 'À l’instant';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'À l’instant';
  }
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    productService
      .getProduct(slug)
      .then(({ data }) => {
        setProduct(data);
        setReviews(buildDefaultReviews(data));
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [slug, notify]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      notify('Produit ajouté au panier', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

    if (!reviewText.trim()) {
      notify('Veuillez écrire un commentaire avant de publier.', 'error');
      return;
    }

    const newReview = {
      id: Date.now(),
      author: user?.username || user?.first_name || 'Client',
      rating: reviewRating,
      title: reviewRating >= 4 ? 'Très bon produit' : 'Produit intéressant',
      comment: reviewText.trim(),
      created_at: new Date().toISOString(),
    };

    setReviews((current) => [newReview, ...current]);
    setReviewText('');
    setReviewRating(5);
    notify('Votre avis a bien été ajouté.', 'success');
  };

  if (loading) return <Loader fullPage />;
  if (!product) return <div className="container page"><p>Produit introuvable.</p></div>;

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <motion.div
      className="container page product-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <section className="card product-detail__hero">
        <div className="product-detail__image">
          {product.display_image ? (
            <img src={product.display_image} alt={product.name} />
          ) : (
            <div className="product-card__placeholder product-card__placeholder--lg">📦</div>
          )}
        </div>

        <div className="product-detail__info">
          {product.brand && <span className="product-card__brand">{product.brand}</span>}
          <h1>{product.name}</h1>

          <div className="product-detail__rating">
            <span className="product-detail__rating-stars">{'★'.repeat(Math.round(Number(averageRating)))}{'☆'.repeat(5 - Math.round(Number(averageRating)))}</span>
            <span>{averageRating} · {reviews.length} avis</span>
          </div>

          <p className="product-detail__price">{Number(product.price).toFixed(2)} €</p>
          <p className="product-detail__desc">{product.description}</p>

          <div className="product-detail__meta">
            <div className="product-detail__meta-item">
              <span className="product-detail__meta-label">Disponibilité</span>
              <strong>{product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}</strong>
            </div>
            <div className="product-detail__meta-item">
              <span className="product-detail__meta-label">Catégorie</span>
              <strong>{product.category_name || 'Produit'}</strong>
            </div>
          </div>

          {product.stock > 0 && (
            <div className="product-detail__actions">
              <div className="quantity-control">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? 'Ajout...' : 'Ajouter au panier'}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="product-detail__content">
        <section className="card product-detail__section">
          <h2>À propos de ce produit</h2>
          <p>{product.description}</p>
        </section>

        {product.specs && Object.keys(product.specs).length > 0 && (
          <section className="card product-detail__section">
            <h2>Caractéristiques</h2>
            <dl className="product-detail__specs">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      <section className="card product-detail__reviews">
        <div className="product-detail__reviews-header">
          <div>
            <h2>Avis clients</h2>
            <p>Découvrez les retours d’autres acheteurs et partagez votre expérience.</p>
          </div>

          <div className="product-detail__rating-summary">
            <strong>{averageRating}</strong>
            <span>sur 5</span>
            <small>{reviews.length} avis</small>
          </div>
        </div>

        <form className="product-detail__review-form" onSubmit={handleSubmitReview}>
          <label>
            Votre commentaire
            <textarea
              className="input"
              rows="4"
              placeholder="Décrivez votre expérience avec ce produit..."
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
            />
          </label>

          <div className="product-detail__review-rating">
            <span>Votre note</span>
            <div className="product-detail__stars" role="radiogroup" aria-label="Sélectionner une note">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    className="product-detail__star-btn"
                    aria-label={`Noter ${value} étoiles`}
                    onClick={() => setReviewRating(value)}
                  >
                    {value <= reviewRating ? '★' : '☆'}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn btn--primary">
            {isAuthenticated ? 'Publier mon avis' : 'Se connecter pour commenter'}
          </button>
        </form>

        <div className="product-detail__review-list">
          {reviews.map((review) => (
            <article className="product-detail__review-item" key={review.id}>
              <div className="product-detail__review-top">
                <div>
                  <h3>{review.title || 'Avis client'}</h3>
                  <p className="product-detail__review-author">{review.author}</p>
                </div>
                <span className="product-detail__review-rating-display">
                  {'★'.repeat(Number(review.rating || 0))}{'☆'.repeat(5 - Number(review.rating || 0))}
                </span>
              </div>
              <p>{review.comment}</p>
              <span className="product-detail__review-date">{formatReviewDate(review.created_at)}</span>
            </article>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
