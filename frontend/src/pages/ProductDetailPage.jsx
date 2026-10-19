import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Loader } from '../components/common/Loader';
import { getProductDiscount } from '../utils/productHelpers';
import styles from './ProductDetailPage.module.css';

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

const getGallery = (product) => {
  const extra = Array.isArray(product?.images) ? product.images : [];
  const urls = [product?.display_image, ...extra.map((i) => (typeof i === 'string' ? i : i?.image || i?.url))]
    .filter(Boolean);
  return [...new Set(urls)];
};

function Stars({ value, className = '' }) {
  const full = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className={`${styles.stars} ${className}`} role="img" aria-label={`${full} sur 5`}>
      {'★'.repeat(full)}
      <span className={styles.starOff}>{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const tabsRef = useRef(null);
  const actionsRef = useRef(null);
  const addedTimer = useRef(null);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  // Charge le produit ET ses vrais avis depuis l'API
  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setActiveTab('description');
    setActiveImage(0);

    Promise.all([
      productService.getProduct(slug),
      reviewService.getProductReviews(slug).catch(() => ({ data: [] })),
    ])
      .then(([{ data: productData }, { data: reviewsData }]) => {
        setProduct(productData);
        setReviews(reviewsData.results || reviewsData);
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [slug, notify]);

  // Barre d'achat collée en bas (mobile) quand le bouton principal sort de l'écran
  useEffect(() => {
    const node = actionsRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const handleZoom = (event) => {
    const box = event.currentTarget;
    const rect = box.getBoundingClientRect();
    box.style.setProperty('--zx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    box.style.setProperty('--zy', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      notify('Produit ajouté au panier', 'success');
      setAdded(true);
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  // Publie un vrai avis via l'API
  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

    if (!reviewText.trim()) {
      notify('Veuillez écrire un commentaire avant de publier.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await reviewService.createReview(slug, {
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewText.trim(),
      });
      setReviews((current) => [data, ...current]);
      setReviewText('');
      setReviewTitle('');
      setReviewRating(5);
      notify('Votre avis a bien été ajouté.', 'success');
    } catch (err) {
      // ex : "Vous avez déjà publié un avis pour ce produit."
      const detail = err.response?.data?.detail;
      notify(detail || getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviews = () => {
    setActiveTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <Loader fullPage />;
  if (!product) return <div className="container page"><p>Produit introuvable.</p></div>;

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(Number(r.rating)) === star).length;
    return { star, count, percent: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 5;
  const hasSpecs = product.specs && Object.keys(product.specs).length > 0;
  const highlights = hasSpecs ? Object.entries(product.specs).slice(0, 3) : [];
  const gallery = getGallery(product);
  const discount = getProductDiscount(product);
  const total = (Number(product.price) * quantity).toFixed(2);

  const tabs = [
    { id: 'description', label: 'Description' },
    ...(hasSpecs ? [{ id: 'specs', label: 'Caractéristiques' }] : []),
    { id: 'reviews', label: 'Avis', count: reviews.length },
  ];

  const ease = [0.22, 1, 0.36, 1];
  const shownRating = hoverRating || reviewRating;

  const addLabel = adding ? 'Ajout...' : added ? 'Ajouté au panier' : 'Ajouter au panier';

  return (
    <div className={styles.detail}>
      {/* ---------- Bandeau ---------- */}
      <div className={styles.band}>
        <motion.p
          className={styles.bandTitle}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          Détails du <span className={styles.bandAccent}>Produit</span>
        </motion.p>
      </div>
      <br></br>
      <motion.div
        className={`container ${styles.content}`}
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
      >
        {/* ---------- Bloc principal : galerie + achat ---------- */}
        <section className={styles.hero}>
          <div className={styles.gallery}>
            <div className={styles.imageBox} onMouseMove={handleZoom}>
              {discount ? (
                <span className={styles.discountBadge}>
                  {typeof discount === 'number' ? `-${discount}%` : 'Promo'}
                </span>
              ) : null}

              {gallery.length > 0 ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={gallery[activeImage] || gallery[0]}
                    src={gallery[activeImage] || gallery[0]}
                    alt={product.name}
                    className={styles.image}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
              ) : (
                <div className={styles.imagePlaceholder} aria-hidden="true">📦</div>
              )}
            </div>

            {gallery.length > 1 && (
              <div className={styles.thumbs}>
                {gallery.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    className={`${styles.thumb}${index === activeImage ? ` ${styles.thumbActive}` : ''}`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`Voir l'image ${index + 1}`}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <div className={styles.topLine}>
              {product.brand && <span className={styles.brand}>{product.brand}</span>}
              {product.category_name && <span className={styles.category}>{product.category_name}</span>}
            </div>

            <h1 className={styles.name}>{product.name}</h1>

            <button type="button" className={styles.ratingRow} onClick={openReviews}>
              <Stars value={averageRating} />
              <span>{averageRating}</span>
              <span className={styles.ratingLink}>
                {reviews.length > 0 ? `${reviews.length} avis` : 'Aucun avis'}
              </span>
            </button>

            <p className={styles.price}>{Number(product.price).toFixed(2)} €</p>

            <p className={styles.shortDesc}>{product.description}</p>

            {highlights.length > 0 && (
              <ul className={styles.highlights}>
                {highlights.map(([key, val]) => (
                  <li key={key} className={styles.highlight}>
                    <span>{key}</span>
                    <strong>{String(val)}</strong>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.buyBox} ref={actionsRef}>
              <p className={`${styles.stock} ${inStock ? styles.stockOk : styles.stockOut}`}>
                <span className={styles.stockDot} aria-hidden="true" />
                {!inStock && 'Rupture de stock'}
                {inStock && !lowStock && `${product.stock} en stock`}
                {lowStock && `Plus que ${product.stock} en stock`}
              </p>

              {inStock && (
                <>
                  <div className={styles.actions}>
                    <div className={styles.quantity}>
                      <motion.button
                        type="button"
                        aria-label="Diminuer la quantité"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        whileTap={{ scale: 0.88 }}
                      >
                        −
                      </motion.button>
                      <span aria-live="polite">{quantity}</span>
                      <motion.button
                        type="button"
                        aria-label="Augmenter la quantité"
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        whileTap={{ scale: 0.88 }}
                      >
                        +
                      </motion.button>
                    </div>

                    <motion.button
                      type="button"
                      className={`${styles.addBtn}${added ? ` ${styles.addBtnDone}` : ''}`}
                      onClick={handleAddToCart}
                      disabled={adding}
                      whileTap={{ scale: 0.98 }}
                    >
                      {added ? (
                        <svg viewBox="0 0 24 24" className={styles.addIcon} aria-hidden="true">
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className={styles.addIcon} aria-hidden="true">
                          <circle cx="9" cy="20" r="1.4" />
                          <circle cx="18" cy="20" r="1.4" />
                          <path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
                        </svg>
                      )}
                      {addLabel}
                    </motion.button>
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total</span>
                    <strong>{total} €</strong>
                  </div>
                </>
              )}

              <p className={styles.note}>
                <svg viewBox="0 0 24 24" className={styles.noteIcon} aria-hidden="true">
                  <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" />
                  <circle cx="7.5" cy="17.5" r="1.7" />
                  <circle cx="17.5" cy="17.5" r="1.7" />
                </svg>
                Livraison gratuite dès 50 DH d'achat
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Onglets ---------- */}
        <section className={styles.tabsCard} ref={tabsRef}>
          <div className={styles.tabList} role="tablist">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.tab}${active ? ` ${styles.tabActive}` : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.count !== undefined && <span className={styles.tabCount}>{tab.count}</span>}
                  {active && (
                    <motion.span
                      layoutId="detail-tab-underline"
                      className={styles.tabUnderline}
                      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              className={styles.panel}
              role="tabpanel"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease }}
            >
              {/* Description */}
              {activeTab === 'description' && (
                <div className={styles.prose}>
                  <h2 className={styles.panelTitle}>À propos de ce produit</h2>
                  <p>{product.description}</p>
                </div>
              )}

              {/* Caractéristiques */}
              {activeTab === 'specs' && hasSpecs && (
                <div>
                  <h2 className={styles.panelTitle}>Caractéristiques</h2>
                  <dl className={styles.specs}>
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className={styles.specRow}>
                        <dt>{key}</dt>
                        <dd>{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Avis */}
              {activeTab === 'reviews' && (
                <div>
                  <div className={styles.reviewsTop}>
                    <div className={styles.summary}>
                      <div className={styles.summaryScore}>
                        <strong>{averageRating}</strong>
                        <span>sur 5</span>
                      </div>
                      <Stars value={averageRating} className={styles.summaryStars} />
                      <small>{reviews.length} avis</small>

                      <ul className={styles.bars}>
                        {distribution.map((row) => (
                          <li key={row.star} className={styles.barRow}>
                            <span>{row.star}★</span>
                            <span className={styles.barTrack}>
                              <motion.span
                                className={styles.barFill}
                                initial={reduceMotion ? false : { width: 0 }}
                                animate={{ width: `${row.percent}%` }}
                                transition={{ duration: 0.6, ease }}
                              />
                            </span>
                            <span className={styles.barCount}>{row.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmitReview}>
                      <h2 className={styles.panelTitle}>Donnez votre avis</h2>

                      <div className={styles.formRating}>
                        <span>Votre note</span>
                        <div
                          className={styles.starPicker}
                          role="radiogroup"
                          aria-label="Sélectionner une note"
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          {Array.from({ length: 5 }, (_, index) => {
                            const value = index + 1;
                            return (
                              <motion.button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={reviewRating === value}
                                className={`${styles.starBtn}${value <= shownRating ? ` ${styles.starOn}` : ''}`}
                                aria-label={`Noter ${value} étoiles`}
                                onMouseEnter={() => setHoverRating(value)}
                                onClick={() => setReviewRating(value)}
                                whileTap={{ scale: 0.8 }}
                              >
                                ★
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <label className={styles.field}>
                        <span>Titre (facultatif)</span>
                        <input
                          type="text"
                          className={styles.textarea}
                          maxLength={120}
                          placeholder="Résumez votre avis"
                          value={reviewTitle}
                          onChange={(event) => setReviewTitle(event.target.value)}
                        />
                      </label>

                      <label className={styles.field}>
                        <span>Votre commentaire</span>
                        <textarea
                          className={styles.textarea}
                          rows="4"
                          placeholder="Décrivez votre expérience avec ce produit..."
                          value={reviewText}
                          onChange={(event) => setReviewText(event.target.value)}
                        />
                      </label>

                      <button type="submit" className={styles.submitBtn} disabled={submitting}>
                        {!isAuthenticated
                          ? 'Se connecter pour commenter'
                          : submitting
                            ? 'Publication...'
                            : 'Publier mon avis'}
                      </button>
                    </form>
                  </div>

                  <div className={styles.reviewList}>
                    {reviews.length === 0 && (
                      <p className={styles.reviewText}>
                        Aucun avis pour le moment. Soyez le premier à donner le vôtre !
                      </p>
                    )}

                    <AnimatePresence initial={false}>
                      {reviews.map((review) => (
                        <motion.article
                          key={review.id}
                          className={styles.review}
                          layout={!reduceMotion}
                          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease }}
                        >
                          <span className={styles.avatar} aria-hidden="true">
                            {(review.author || 'C').charAt(0).toUpperCase()}
                          </span>
                          <div className={styles.reviewBody}>
                            <div className={styles.reviewHead}>
                              <div>
                                <p className={styles.reviewAuthor}>{review.author}</p>
                                <span className={styles.reviewDate}>{formatReviewDate(review.created_at)}</span>
                              </div>
                              <Stars value={review.rating} />
                            </div>
                            <h3 className={styles.reviewTitle}>{review.title || 'Avis client'}</h3>
                            <p className={styles.reviewText}>{review.comment}</p>
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </motion.div>

      {/* ---------- Barre d'achat mobile ---------- */}
      <AnimatePresence>
        {showBar && inStock && (
          <motion.div
            className={styles.stickyBar}
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className={styles.stickyInfo}>
              <span className={styles.stickyName}>{product.name}</span>
              <strong>{Number(product.price).toFixed(2)} €</strong>
            </div>
            <button type="button" className={styles.stickyBtn} onClick={handleAddToCart} disabled={adding}>
              {addLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}