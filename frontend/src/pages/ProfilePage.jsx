import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Pencil,
  ChevronRight,
  Star,
  Undo2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { getErrorMessage } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import styles from './ProfilePage.module.css';

const TABS = [
  { id: 'infos', label: 'Mon profil ', icon: User },
  { id: 'commandes', label: 'Vos commandes', icon: Package },
  { id: 'retours', label: 'Retours', icon: Undo2 },
  { id: 'favoris', label: 'Favoris', icon: Heart },
  { id: 'avis', label: 'Avis', icon: Star },
  { id: 'adresses', label: 'Adresses', icon: MapPin },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { addToCart } = useCart();
  const { notify } = useNotification();

  // L'onglet actif vient de l'adresse : /profile?tab=commandes ou /profile?tab=favoris
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'infos';
  const setActiveTab = (id) => setSearchParams(id === 'infos' ? {} : { tab: id });

  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Avis publiés par l'utilisateur connecté
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Bascule lecture / édition pour "Informations" et "Adresses"
  const [editingInfos, setEditingInfos] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  useEffect(() => {
    if (!wishlistItems || wishlistItems.length === 0) {
      setWishlistProducts([]);
      return;
    }
    setWishlistLoading(true);
    Promise.all(
      wishlistItems.map((item) => productService.getProduct(item.slug).catch(() => null))
    )
      .then((results) => {
        setWishlistProducts(results.filter(Boolean).map((r) => r.data));
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setWishlistLoading(false));
  }, [wishlistItems, notify]);

  useEffect(() => {
    setOrdersLoading(true);
    orderService
      .getOrders()
      .then(({ data }) => setOrders(data.results || data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setOrdersLoading(false));
  }, [notify]);

  useEffect(() => {
    setReviewsLoading(true);
    reviewService
      .getMyReviews()
      .then(({ data }) => setMyReviews(data.results || data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setReviewsLoading(false));
  }, [notify]);

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birth_date: user?.birth_date || '',
  });

  const [address, setAddress] = useState({
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    country: user?.country || 'Maroc',
  });

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  const initials = `${form.first_name?.[0] || ''}${form.last_name?.[0] || ''}`.toUpperCase() || 'U';

  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = async (product) => {
    setAddingId(product.id);
    try {
      await addToCart(product.id, 1);
      notify('Produit ajouté au panier', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleSubmitInfos = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      notify('Profil mis à jour', 'success');
      setEditingInfos(false);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(address);
      notify('Adresse mise à jour', 'success');
      setEditingAddress(false);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) {
      notify('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    setLoading(true);
    try {
      await changePassword({
        current_password: pwd.current,
        new_password: pwd.next,
        confirm_password: pwd.confirm,
      });
      notify('Mot de passe modifié', 'success');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const statusStyle = {
    pending: { label: 'En attente', className: `${styles.badge} ${styles.badgeWarning}` },
    processing: { label: 'En préparation', className: `${styles.badge} ${styles.badgeInfo}` },
    shipped: { label: 'Expédiée', className: `${styles.badge} ${styles.badgeInfo}` },
    delivered: { label: 'Livrée', className: `${styles.badge} ${styles.badgeSuccess}` },
    cancelled: { label: 'Annulée', className: `${styles.badge} ${styles.badgeDanger}` },
  };

  return (
    <div className={`container page ${styles.profilePage}`}>
      <div className={styles.profileLayout}>
        {/* ===== Sidebar ===== */}
        <aside className={styles.profileSidebar}>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatarPhoto}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={form.first_name} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <p className={styles.profileCardTitle}>
              {form.first_name || user?.username} {form.last_name}
            </p>
            <p className={styles.profileCardSubtitle}>{form.email}</p>
          </div>

          <nav className={styles.profileTabs}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.profileTab} ${activeTab === tab.id ? styles.profileTabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}

            {logout && (
              <>
                <div className={styles.navDivider} />
                <button className={`${styles.profileTab} ${styles.profileTabDanger}`} onClick={logout}>
                  <LogOut size={17} />
                  Déconnexion
                </button>
              </>
            )}
          </nav>
        </aside>

        {/* ===== Contenu ===== */}
        <div className={styles.profileContent}>
          <AnimatePresence mode="wait">
            {/* Informations personnelles */}
            {activeTab === 'infos' && (
              <motion.div key="infos" {...fadeSlide}>
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                  <div className={styles.cardHeader}>
                    <h2>Informations personnelles</h2>
                    {!editingInfos && (
                      <button
                        type="button"
                        className="btn btn--outline"
                        onClick={() => setEditingInfos(true)}
                      >
                        <Pencil size={15} /> Modifier
                      </button>
                    )}
                  </div>

                  {!editingInfos ? (
                    <div className={styles.infoRows}>
                      <div className={styles.infoRow}>
                        <User size={18} className={styles.infoRowIcon} />
                        <span className={styles.infoRowLabel}>Nom complet</span>
                        <span className={styles.infoRowValue}>
                          {form.first_name} {form.last_name}
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <Mail size={18} className={styles.infoRowIcon} />
                        <span className={styles.infoRowLabel}>Email</span>
                        <span className={styles.infoRowValue}>{form.email}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <Phone size={18} className={styles.infoRowIcon} />
                        <span className={styles.infoRowLabel}>Téléphone</span>
                        <span className={styles.infoRowValue}>{form.phone || '—'}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <Calendar size={18} className={styles.infoRowIcon} />
                        <span className={styles.infoRowLabel}>Date de naissance</span>
                        <span className={styles.infoRowValue}>{formatDate(form.birth_date)}</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitInfos} className="form">
                      <div className="form--grid">
                        <label>
                          Prénom
                          <input
                            type="text"
                            name="first_name"
                            className="input"
                            value={form.first_name}
                            onChange={handleChange(setForm)}
                          />
                        </label>
                        <label>
                          Nom
                          <input
                            type="text"
                            name="last_name"
                            className="input"
                            value={form.last_name}
                            onChange={handleChange(setForm)}
                          />
                        </label>
                        <label className="form__full">
                          Email
                          <input
                            type="email"
                            name="email"
                            className="input"
                            value={form.email}
                            onChange={handleChange(setForm)}
                          />
                        </label>
                        <label>
                          Téléphone
                          <input
                            type="tel"
                            name="phone"
                            className="input"
                            value={form.phone}
                            onChange={handleChange(setForm)}
                          />
                        </label>
                        <label>
                          Date de naissance
                          <input
                            type="date"
                            name="birth_date"
                            className="input"
                            value={form.birth_date}
                            onChange={handleChange(setForm)}
                          />
                        </label>
                      </div>
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className="btn btn--outline"
                          onClick={() => setEditingInfos(false)}
                        >
                          Annuler
                        </button>
                        <button type="submit" className="btn btn--primary" disabled={loading}>
                          {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            )}

            {/* Commandes */}
            {activeTab === 'commandes' && (
              <motion.div key="commandes" {...fadeSlide} className="card">
                <div className={styles.cardHeader}>
                  <h2>Vos commandes</h2>
                </div>
                {ordersLoading ? (
                  <p>Chargement...</p>
                ) : orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Aucune commande pour le moment.</p>
                    <Link to="/products?ordering=-created_at" className="btn btn--outline">
                      Découvrir nos produits
                    </Link>
                  </div>
                ) : (
                  <ul className={styles.orderList}>
                    {orders.map((order) => {
                      const thumb =
                        order.items?.[0]?.product?.display_image ||
                        order.items?.[0]?.product?.image ||
                        order.items?.[0]?.image;
                      return (
                        <motion.li
                          key={order.id}
                          className={styles.orderListItem}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          {thumb ? (
                            <img src={thumb} alt="" className={styles.orderListThumb} />
                          ) : (
                            <div className={styles.orderListIcon}>
                              <Package size={20} />
                            </div>
                          )}
                          <div className={styles.orderListMain}>
                            <strong>Commande #{order.reference || order.id}</strong>
                            <p className={styles.orderListDate}>
                              Passée le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span className={statusStyle[order.status]?.className || styles.badge}>
                            {statusStyle[order.status]?.label || order.status}
                          </span>
                          <span className={styles.orderListTotal}>
                            {Number(order.total).toFixed(2)} MAD
                          </span>
                          <Link to={`/orders/${order.id}`} className={styles.orderListLink}>
                            <ChevronRight size={18} />
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            )}

            {/* Retours */}
            {activeTab === 'retours' && (
              <motion.div key="retours" {...fadeSlide} className="card">
                <div className={styles.cardHeader}>
                  <h2>Retours</h2>
                </div>
                <div className={styles.emptyState}>
                  <p>Vous n'avez aucune demande de retour en cours.</p>
                  <Link to="/orders" className="btn btn--outline">
                    Voir mes commandes
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Adresses */}
            {activeTab === 'adresses' && (
              <motion.div key="adresses" {...fadeSlide} className="card">
                <div className={styles.cardHeader}>
                  <h2>Adresse de livraison</h2>
                  {!editingAddress && (
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => setEditingAddress(true)}
                    >
                      <Pencil size={15} /> Modifier
                    </button>
                  )}
                </div>

                {!editingAddress ? (
                  <div className={styles.infoRows}>
                    <div className={styles.infoRow}>
                      <MapPin size={18} className={styles.infoRowIcon} />
                      <span className={styles.infoRowLabel}>Adresse</span>
                      <span className={styles.infoRowValue}>{address.address || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <MapPin size={18} className={styles.infoRowIcon} />
                      <span className={styles.infoRowLabel}>Ville</span>
                      <span className={styles.infoRowValue}>{address.city || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <MapPin size={18} className={styles.infoRowIcon} />
                      <span className={styles.infoRowLabel}>Code postal</span>
                      <span className={styles.infoRowValue}>{address.postal_code || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <MapPin size={18} className={styles.infoRowIcon} />
                      <span className={styles.infoRowLabel}>Pays</span>
                      <span className={styles.infoRowValue}>{address.country || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAddress} className="form">
                    <div className="form--grid">
                      <label className="form__full">
                        Adresse
                        <textarea
                          name="address"
                          className="input"
                          rows={2}
                          value={address.address}
                          onChange={handleChange(setAddress)}
                        />
                      </label>
                      <label>
                        Ville
                        <input
                          type="text"
                          name="city"
                          className="input"
                          value={address.city}
                          onChange={handleChange(setAddress)}
                        />
                      </label>
                      <label>
                        Code postal
                        <input
                          type="text"
                          name="postal_code"
                          className="input"
                          value={address.postal_code}
                          onChange={handleChange(setAddress)}
                        />
                      </label>
                      <label className="form__full">
                        Pays
                        <input
                          type="text"
                          name="country"
                          className="input"
                          value={address.country}
                          onChange={handleChange(setAddress)}
                        />
                      </label>
                    </div>
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className="btn btn--outline"
                        onClick={() => setEditingAddress(false)}
                      >
                        Annuler
                      </button>
                      <button type="submit" className="btn btn--primary" disabled={loading}>
                        {loading ? 'Enregistrement...' : "Enregistrer l'adresse"}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* Favoris */}
            {activeTab === 'favoris' && (
              <motion.div key="favoris" {...fadeSlide} className="card">
                <div className={styles.cardHeader}>
                  <h2>Favoris</h2>
                </div>
                {wishlistLoading ? (
                  <p>Chargement...</p>
                ) : wishlistProducts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Vous n'avez pas encore ajouté de produits en favoris.</p>
                    <Link to="/products?ordering=-created_at" className="btn btn--outline">
                      Voir le catalogue
                    </Link>
                  </div>
                ) : (
                  <div className={styles.wishlistGrid}>
                    {wishlistProducts.map((item) => {
                      const outOfStock = item.stock !== undefined && item.stock <= 0;
                      return (
                        <motion.div
                          key={item.id}
                          className={styles.wishlistCard}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Link to={`/products/${item.slug}`} className={styles.wishlistCardLink}>
                            <img
                              src={item.display_image || item.image || item.image_url}
                              alt={item.name}
                              className={styles.wishlistCardImg}
                            />
                            <p className={styles.wishlistCardName}>{item.name}</p>
                          </Link>
                          <p className={styles.wishlistCardPrice}>{item.price} MAD</p>
                          <button
                            type="button"
                            className={styles.wishlistCardBtn}
                            onClick={() => handleAddToCart(item)}
                            disabled={outOfStock || addingId === item.id}
                          >
                            {outOfStock
                              ? 'Rupture de stock'
                              : addingId === item.id
                                ? 'Ajout...'
                                : 'Ajouter au panier'}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Avis */}
            {activeTab === 'avis' && (
              <motion.div key="avis" {...fadeSlide} className="card">
                <div className={styles.cardHeader}>
                  <h2>Avis ({myReviews.length})</h2>
                </div>

                {reviewsLoading ? (
                  <p>Chargement...</p>
                ) : myReviews.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Vous n'avez pas encore publié d'avis.</p>
                    <Link to="/products?ordering=-created_at" className="btn btn--outline">
                      Voir le catalogue
                    </Link>
                  </div>
                ) : (
                  <ul className={styles.orderList}>
                    {myReviews.map((review) => (
                      <motion.li
                        key={review.id}
                        className={styles.orderListItem}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className={styles.orderListMain}>
                          <strong>
                            <Link to={`/products/${review.product_slug}`}>
                              {review.product_name}
                            </Link>
                          </strong>
                          <p className={styles.orderListDate}>
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)} · {formatDate(review.created_at)}
                          </p>
                          {review.title && <p><strong>{review.title}</strong></p>}
                          {review.comment && <p>{review.comment}</p>}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            {/* Paramètres (sécurité) */}
            {activeTab === 'parametres' && (
              <motion.form
                key="parametres"
                {...fadeSlide}
                onSubmit={handleSubmitPassword}
                className="form card"
              >
                <div className={styles.cardHeader}>
                  <h2>Paramètres</h2>
                </div>
                <div className="form--grid">
                  <label className="form__full">
                    Mot de passe actuel
                    <input
                      type="password"
                      name="current"
                      className="input"
                      value={pwd.current}
                      onChange={handleChange(setPwd)}
                    />
                  </label>
                  <label>
                    Nouveau mot de passe
                    <input
                      type="password"
                      name="next"
                      className="input"
                      value={pwd.next}
                      onChange={handleChange(setPwd)}
                    />
                  </label>
                  <label>
                    Confirmer
                    <input
                      type="password"
                      name="confirm"
                      className="input"
                      value={pwd.confirm}
                      onChange={handleChange(setPwd)}
                    />
                  </label>
                </div>
                <button type="submit" className="btn btn--primary" disabled={loading}>
                  {loading ? 'Modification...' : 'Changer le mot de passe'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}