import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { getErrorMessage } from '../services/api';
import { Loader } from '../components/common/Loader';
import { formatPrice } from '../utils/productHelpers';
import styles from './CartPage.module.css';

function TrashIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const { notify } = useNotification();

  const handleUpdate = async (itemId, quantity) => {
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId);
      notify('Article retiré', 'info');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <Loader fullPage />;

  if (!cart?.items?.length) {
    return (
      <div className="container page">
        <h1 className="page__title">Panier</h1>
        <div className="empty-state card">
          <p>Votre panier est vide.</p>
          <Link to="/products" className={`btn btn--primary ${styles.pill}`}>
            Voir les produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page__title">Panier ({cart.item_count} articles)</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item card">
              <div className="cart-item__image">
                {item.product.display_image ? (
                  <img src={item.product.display_image} alt={item.product.name} />
                ) : (
                  <span>📦</span>
                )}
              </div>
              <div className="cart-item__info">
                <Link to={`/products/${item.product.slug}`}>{item.product.name}</Link>
                <p>{formatPrice(item.product.price)}</p>
              </div>

              <div className={`quantity-control ${styles.quantity}`}>
                <button
                  type="button"
                  onClick={() => handleUpdate(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Diminuer la quantité"
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleUpdate(item.id, item.quantity + 1)}
                  aria-label="Augmenter la quantité"
                >
                  +
                </button>
              </div>

              <p className="cart-item__subtotal">{formatPrice(item.subtotal)}</p>

              <button
                type="button"
                className={`btn btn--ghost btn--sm ${styles.remove}`}
                onClick={() => handleRemove(item.id)}
                aria-label="Supprimer l'article"
                title="Supprimer"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary card">
          <h2>Récapitulatif</h2>
          <div className="cart-summary__row">
            <span>Total</span>
            <strong>{formatPrice(cart.total)}</strong>
          </div>
          <Link to="/checkout" className={`btn btn--primary btn--full ${styles.pill}`}>
            Passer commande
          </Link>
        </aside>
      </div>
    </div>
  );
}