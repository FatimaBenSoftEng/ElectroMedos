import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Loader } from '../components/common/Loader';

const STATUS_LABELS = {
  pending: 'En attente',
  processing: 'En cours',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    orderService
      .getOrders()
      .then(({ data }) => setOrders(data.results || data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) return <Loader fullPage />;

  return (
    <div className="container page">
      <h1 className="page__title">Mes commandes</h1>
      {!orders.length ? (
        <div className="empty-state card">
          <p>Aucune commande pour le moment.</p>
          <Link to="/products" className="btn btn--primary">Acheter</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="order-card card">
              <div>
                <strong>Commande #{order.id}</strong>
                <p className="order-card__date">
                  {new Date(order.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className={`status-badge status-badge--${order.status}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <strong>{Number(order.total).toFixed(2)} €</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
