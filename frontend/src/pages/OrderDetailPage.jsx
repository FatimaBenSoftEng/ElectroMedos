import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  Package,
  Truck,
  MapPin,
  Mail,
  Phone,
  User,
  StickyNote,
  XCircle,
  Printer,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Loader } from '../components/common/Loader';
import styles from './OrderDetailPage.module.css';

/* const STATUS_LABELS = {
  pending: 'En attente',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}; */

const BADGE_CLASS = {
  pending: styles.badgeWarning,
  processing: styles.badgeInfo,
  shipped: styles.badgeInfo,
  delivered: styles.badgeSuccess,
  cancelled: styles.badgeDanger,
};

// Les 4 étapes du suivi (une commande annulée n'affiche pas ce suivi)
const STEPS = [
  { id: 'pending', label: 'Commande reçue', icon: Clock },
  { id: 'processing', label: 'En préparation', icon: Package },
  { id: 'shipped', label: 'Expédiée', icon: Truck },
  { id: 'delivered', label: 'Livrée', icon: Check },
];

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} MAD`;

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
  if (!order) {
    return (
      <div className="container page">
        <p>Commande introuvable.</p>
      </div>
    );
  }

  const items = order.items || [];
  const itemsCount = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const itemsTotal = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
  const extra = Number(order.total) - itemsTotal; // frais de livraison, remises, etc.
  const cancelled = order.status === 'cancelled';
  const currentStep = STEPS.findIndex((s) => s.id === order.status);
  const fullName = [order.first_name, order.last_name].filter(Boolean).join(' ');

  return (
    <div className={`container page ${styles.page}`}>
      {/* ===== Barre d'actions : retour à gauche, imprimer à droite ===== */}
      <div className={styles.toolbar}>
        <Link to="/profile?tab=commandes" className={styles.btn}>
          <ArrowLeft size={18} />
          Retour à mes commandes
        </Link>
       {/*  <button type="button" className={styles.btn} onClick={() => window.print()}>
          <Printer size={18} />
          Imprimer
        </button> */}
      </div>

      {/* ===== En-tête : titre + statut côte à côte ===== */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Commande #{order.reference || order.id}</h1>
         {/*  <span className={`${styles.badge} ${BADGE_CLASS[order.status] || ''}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span> */}
        </div>
        <p className={styles.date}>
          Passée le{' '}
          {new Date(order.created_at).toLocaleString('fr-FR', {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
        </p>
      </header>

      {/* ===== Suivi de commande ===== */}
      <section className={styles.card} aria-label="Suivi de la commande">
        {cancelled ? (
          <div className={styles.cancelled}>
            <XCircle size={22} />
            <div>
              <strong>Cette commande a été annulée.</strong>
              <p>Si vous avez une question, contactez-nous.</p>
            </div>
          </div>
        ) : (
          <ol className={styles.tracker}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const done = index < currentStep;
              const current = index === currentStep;
              return (
                <li
                  key={step.id}
                  className={`${styles.step} ${done ? styles.stepDone : ''} ${
                    current ? styles.stepCurrent : ''
                  }`}
                  aria-current={current ? 'step' : undefined}
                >
                  <span className={styles.stepDot}>
                    {done ? <Check size={16} /> : <Icon size={16} />}
                  </span>
                  <span className={styles.stepLabel}>{step.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className={styles.layout}>
        {/* ===== Colonne gauche : Articles ===== */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            Articles <span className={styles.count}>({itemsCount})</span>
          </h2>

          <ul className={styles.items}>
            {items.map((item) => {
              const img =
                item.product?.display_image ||
                item.product?.image ||
                item.product?.image_url ||
                '';
              const name = item.product_name || item.product?.name;
              const content = (
                <>
                  <div className={styles.itemImageWrap}>
                    {img ? (
                      <img src={img} alt={name} className={styles.itemImage} />
                    ) : (
                      <Package size={24} />
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{name}</span>
                    <span className={styles.itemMeta}>
                      {formatMoney(item.price)} × {item.quantity}
                    </span>
                  </div>
                </>
              );

              return (
                <li key={item.id} className={styles.item}>
                  {item.product?.slug ? (
                    <Link to={`/products/${item.product.slug}`} className={styles.itemMain}>
                      {content}
                    </Link>
                  ) : (
                    <div className={styles.itemMain}>{content}</div>
                  )}
                  <span className={styles.itemSubtotal}>{formatMoney(item.subtotal)}</span>
                </li>
              );
            })}
          </ul>

          {/* Récapitulatif */}
          <dl className={styles.summary}>
            <div className={styles.summaryRow}>
              <dt>Articles ({itemsCount})</dt>
              <dd>{formatMoney(itemsTotal)}</dd>
            </div>
            {Math.abs(extra) > 0.005 && (
              <div className={styles.summaryRow}>
                <dt>{extra > 0 ? 'Livraison et frais' : 'Remise'}</dt>
                <dd>{formatMoney(extra)}</dd>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <dt>Total</dt>
              <dd>{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* ===== Colonne droite : Livraison + Actions ===== */}
        <aside className={styles.aside}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Livraison</h2>

            <ul className={styles.infoList}>
              <li>
                <User size={18} className={styles.infoIcon} />
                <span>{fullName || '—'}</span>
              </li>
              <li>
                <MapPin size={18} className={styles.infoIcon} />
                <span>
                  {order.address}
                  <br />
                  {[order.postal_code, order.city].filter(Boolean).join(' ')}
                  {order.country && (
                    <>
                      <br />
                      {order.country}
                    </>
                  )}
                </span>
              </li>
              {order.email && (
                <li>
                  <Mail size={18} className={styles.infoIcon} />
                  <a href={`mailto:${order.email}`}>{order.email}</a>
                </li>
              )}
              {order.phone && (
                <li>
                  <Phone size={18} className={styles.infoIcon} />
                  <a href={`tel:${order.phone}`}>{order.phone}</a>
                </li>
              )}
            </ul>

            {order.notes && (
              <div className={styles.notes}>
                <StickyNote size={16} />
                <p>{order.notes}</p>
              </div>
            )}
          </section>

          <section className={`${styles.card} ${styles.actionsCard}`}>
            <h2 className={styles.cardTitle}>Besoin d'aide ?</h2>
            <div className={styles.actions}>
              <Link to="/contact" className={`${styles.btn} ${styles.btnBlock}`}>
                <MessageCircle size={18} />
                Contactez-nous
              </Link>
              <Link to="/products" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}>
                <ShoppingBag size={18} />
                Continuer mes achats
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}