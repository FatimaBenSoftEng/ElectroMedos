import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { getErrorMessage } from '../services/api';
import { Loader } from '../components/common/Loader';

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
          <Link to="/products" className="btn btn--primary">Voir les produits</Link>
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
                <p>{Number(item.product.price).toFixed(2)} €</p>
              </div>
              <div className="quantity-control">
                <button type="button" onClick={() => handleUpdate(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => handleUpdate(item.id, item.quantity + 1)}>+</button>
              </div>
              <p className="cart-item__subtotal">{Number(item.subtotal).toFixed(2)} €</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleRemove(item.id)}>✕</button>
            </div>
          ))}
        </div>
        <aside className="cart-summary card">
          <h2>Récapitulatif</h2>
          <div className="cart-summary__row">
            <span>Total</span>
            <strong>{Number(cart.total).toFixed(2)} €</strong>
          </div>
          <Link to="/checkout" className="btn btn--primary btn--full">Passer commande</Link>
        </aside>
      </div>
    </div>
  );
}
