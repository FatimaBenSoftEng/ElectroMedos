import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    orderService
      .getOrder(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [id, notify]);

  if (loading) return <Loader fullPage />;
  if (!order) return <div className="container page"><p>Commande introuvable.</p></div>;

  return (
    <div className="container page">
      <Link to="/profile" className="btn btn--ghost back-button">← Retour au profil</Link>
      <h1 className="page__title">Commande #{order.id}</h1>
      <div className="order-detail">
        <div className="card">
          <div className="order-detail__header">
            <span className={`status-badge status-badge--${order.status}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <span>{new Date(order.created_at).toLocaleString('fr-FR')}</span>
          </div>
          <h3>Articles</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th>Prix</th>
                <th>Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="order-item">
                      <img
                        src={item.product?.display_image || item.product?.image || item.product?.image_url || ''}
                        alt={item.product_name}
                        className="order-item__image"
                      />
                      <span>{item.product_name}</span>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.price).toFixed(2)} €</td>
                  <td>{Number(item.subtotal).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="order-detail__total">Total : <strong>{Number(order.total).toFixed(2)} €</strong></p>
        </div>
        <div className="card">
          <h3>Livraison</h3>
          <p>{order.first_name} {order.last_name}</p>
          <p>{order.address}</p>
          <p>{order.postal_code} {order.city}</p>
          <p>{order.country}</p>
          <p>{order.email} — {order.phone}</p>
          {order.notes && <p><em>{order.notes}</em></p>}
        </div>
      </div>
    </div>
  );
}
