import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../services/api';
import { Loader } from '../components/common/Loader';
import styles from './CheckoutPage.module.css';

/* ---------- Petits composants d'icônes (SVG inline) ---------- */
const Icon = ({ children, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const LockIcon = ({ size }) => (
  <Icon size={size}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </Icon>
);
const CardIcon = () => (
  <Icon size={26}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h3" />
  </Icon>
);
const BankIcon = () => (
  <Icon size={26}>
    <path d="M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
  </Icon>
);
const ShieldIcon = () => (
  <Icon>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
  </Icon>
);
const TruckIcon = () => (
  <Icon>
    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
  </Icon>
);
const UndoIcon = () => (
  <Icon>
    <path d="M4 9h10a6 6 0 010 12H8M4 9l4-4M4 9l4 4" />
  </Icon>
);
const ArrowLeft = () => (
  <Icon size={16}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

/* ---------- Moyens de paiement ---------- */
const PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Carte bancaire',
    desc: 'Visa, Mastercard, American Express',
    icon: <CardIcon />,
    badge: (
      <span className={styles.badges}>
        <span className={`${styles.badge} ${styles.badgeVisa}`}>VISA</span>
        <span className={`${styles.badge} ${styles.badgeMc}`}>
          <i />
          <i />
        </span>
        <span className={`${styles.badge} ${styles.badgeAmex}`}>AMEX</span>
      </span>
    ),
  },
  {
    id: 'paypal',
    label: 'PayPal',
    desc: 'Payez en toute sécurité avec votre compte PayPal',
    icon: <span className={`${styles.brand} ${styles.brandPaypal}`}>P</span>,
    badge: <span className={`${styles.textBadge} ${styles.textBadgePaypal}`}>PayPal</span>,
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    desc: 'Payez rapidement avec Apple Pay',
    icon: <span className={`${styles.brand} ${styles.brandApple}`}></span>,
    badge: <span className={`${styles.textBadge} ${styles.textBadgeApple}`}> Pay</span>,
  },
  {
    id: 'bancontact',
    label: 'Bancontact',
    desc: 'Paiement via votre compte Bancontact',
    icon: <span className={`${styles.brand} ${styles.brandBancontact}`} />,
    badge: <span className={`${styles.textBadge} ${styles.textBadgeBancontact}`}>Bancontact</span>,
  },
  {
    id: 'transfer',
    label: 'Virement bancaire',
    desc: 'Paiement par virement (délai de traitement : 1 à 2 jours)',
    icon: <BankIcon />,
    badge: null,
  },
];

/* ---------- Formatage des champs carte ---------- */
const formatCardNumber = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [step, setStep] = useState('shipping'); // 'shipping' | 'payment'
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('card');

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    country: user?.country || 'France',
    notes: '',
  });

  // Champs carte : gardés uniquement côté navigateur, jamais envoyés à l'API.
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'number') next = formatCardNumber(value);
    if (name === 'expiry') next = formatExpiry(value);
    if (name === 'cvv') next = value.replace(/\D/g, '').slice(0, 4);
    setCard((prev) => ({ ...prev, [name]: next }));
  };

  const goToPayment = (e) => {
    e.preventDefault();
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, payment_method: method };
      const { data } = await orderService.checkout(payload);
      await refreshCart();
      notify('Commande passée avec succès', 'success');
      navigate(`/orders/${data.id}`);
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Redirection vers /cart si le panier est vide (dans un useEffect, pas pendant le rendu).
  useEffect(() => {
    if (!cartLoading && !cart?.items?.length) {
      navigate('/cart');
    }
  }, [cartLoading, cart, navigate]);

  if (cartLoading) return <Loader fullPage />;
  if (!cart?.items?.length) return null;

  const total = Number(cart.total).toFixed(2);

  return (
    <div className={`container page ${styles.page}`}>
      <div className={styles.layout}>
        {/* ================= Colonne gauche ================= */}
        <section>
          {step === 'shipping' ? (
            <>
              <h1 className={styles.title}>Livraison</h1>
              <p className={styles.subtitle}>Où devons-nous envoyer votre commande ?</p>

              <form onSubmit={goToPayment} className={styles.panel} id="shipping-form">
                <div className={styles.grid}>
                  <label>
                    Prénom
                    <input type="text" name="first_name" className="input" value={form.first_name} onChange={handleChange} required />
                  </label>
                  <label>
                    Nom
                    <input type="text" name="last_name" className="input" value={form.last_name} onChange={handleChange} required />
                  </label>
                  <label className={styles.full}>
                    Email
                    <input type="email" name="email" className="input" value={form.email} onChange={handleChange} required />
                  </label>
                  <label className={styles.full}>
                    Téléphone
                    <input type="tel" name="phone" className="input" value={form.phone} onChange={handleChange} required />
                  </label>
                  <label className={styles.full}>
                    Adresse
                    <textarea name="address" className="input" rows={2} value={form.address} onChange={handleChange} required />
                  </label>
                  <label>
                    Ville
                    <input type="text" name="city" className="input" value={form.city} onChange={handleChange} required />
                  </label>
                  <label>
                    Code postal
                    <input type="text" name="postal_code" className="input" value={form.postal_code} onChange={handleChange} required />
                  </label>
                  <label className={styles.full}>
                    Pays
                    <input type="text" name="country" className="input" value={form.country} onChange={handleChange} required />
                  </label>
                  <label className={styles.full}>
                    Notes (optionnel)
                    <textarea name="notes" className="input" rows={2} value={form.notes} onChange={handleChange} />
                  </label>
                </div>
              </form>

              <button type="button" className={styles.back} onClick={() => navigate('/cart')}>
                <ArrowLeft /> Retour au panier
              </button>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Paiement</h1>
              <p className={styles.subtitle}>Choisissez votre mode de paiement et finalisez votre commande en toute sécurité.</p>

              <form id="payment-form" onSubmit={handlePay} className={styles.methods}>
                {PAYMENT_METHODS.map((m) => {
                  const selected = method === m.id;
                  return (
                    <div key={m.id} className={`${styles.method} ${selected ? styles.isSelected : ''}`}>
                      <label className={styles.methodHead}>
                        <input
                          type="radio"
                          name="payment_method"
                          value={m.id}
                          checked={selected}
                          onChange={() => setMethod(m.id)}
                        />
                        <span className={styles.methodRadio} />
                        <span className={styles.methodIcon}>{m.icon}</span>
                        <span className={styles.methodText}>
                          <strong>{m.label}</strong>
                          <small>{m.desc}</small>
                        </span>
                        {m.badge && <span className={styles.methodBadge}>{m.badge}</span>}
                      </label>

                      {m.id === 'card' && selected && (
                        <div className={styles.cardFields}>
                          <label className={styles.cardFieldsNumber}>
                            Numéro de carte
                            <input
                              type="text"
                              name="number"
                              className="input"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              placeholder="1234 5678 9012 3456"
                              value={card.number}
                              onChange={handleCardChange}
                              required
                              minLength={19}
                            />
                          </label>
                          <label className={styles.cardFieldsExpiry}>
                            Date d'expiration
                            <input
                              type="text"
                              name="expiry"
                              className="input"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              placeholder="MM / AA"
                              value={card.expiry}
                              onChange={handleCardChange}
                              required
                              minLength={7}
                            />
                          </label>
                          <label className={styles.cardFieldsCvv}>
                            Code de sécurité (CVV)
                            <input
                              type="text"
                              name="cvv"
                              className="input"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              placeholder="123"
                              value={card.cvv}
                              onChange={handleCardChange}
                              required
                              minLength={3}
                            />
                          </label>
                          <label className={styles.cardFieldsHolder}>
                            Nom sur la carte
                            <input
                              type="text"
                              name="holder"
                              className="input"
                              autoComplete="cc-name"
                              placeholder="Jean Dupont"
                              value={card.holder}
                              onChange={handleCardChange}
                              required
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </form>

              <button type="button" className={styles.back} onClick={() => setStep('shipping')}>
                <ArrowLeft /> Retour à la livraison
              </button>
            </>
          )}
        </section>

        {/* ================= Récapitulatif ================= */}
        <aside className={styles.summary}>
          <h2>Récapitulatif de la commande</h2>

          <div className={styles.summaryItems}>
            {cart.items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemImg}>
                  {item.product.display_image ? (
                    <img src={item.product.display_image} alt={item.product.name} />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <strong>{item.product.name}</strong>
                  <small>Quantité : {item.quantity}</small>
                </div>
                <span className={styles.itemPrice}>{Number(item.subtotal).toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className={styles.lines}>
            <div>
              <span>Sous-total</span>
              <span>{total} €</span>
            </div>
            <div>
              <span>Livraison</span>
              <span className={styles.free}>Gratuite</span>
            </div>
          </div>

          <div className={styles.total}>
            <span>Total</span>
            <strong>{total} €</strong>
          </div>

          <ul className={styles.guarantees}>
            <li>
              <ShieldIcon />
              <div>
                <strong>Paiement 100% sécurisé</strong>
                <small>Vos informations sont protégées par un cryptage SSL.</small>
              </div>
            </li>
            <li>
              <TruckIcon />
              <div>
                <strong>Livraison rapide</strong>
                <small>Recevez votre commande sous 3 à 5 jours.</small>
              </div>
            </li>
            <li>
              <UndoIcon />
              <div>
                <strong>Satisfait ou remboursé</strong>
                <small>Vous avez 14 jours pour changer d'avis.</small>
              </div>
            </li>
          </ul>

          {step === 'shipping' ? (
            <button type="submit" form="shipping-form" className={styles.pay}>
              Continuer vers le paiement
            </button>
          ) : (
            <button type="submit" form="payment-form" className={styles.pay} disabled={loading}>
              <LockIcon size={20} />
              {loading ? 'Traitement...' : 'Payer maintenant'}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}