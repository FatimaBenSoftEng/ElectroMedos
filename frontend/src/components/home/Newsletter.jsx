import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const { notify } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    notify('Merci pour votre inscription à la newsletter !', 'success');
    setEmail('');
  };

  return (
    <section className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.text}>
          <h2>Inscrivez-vous à la newsletter</h2>
          <p>Recevez nos offres exclusives et nouveautés en avant-première</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Votre adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Adresse e-mail"
          />
          <button type="submit">
            <FiSend aria-hidden />
            S&apos;inscrire
          </button>
        </form>
      </div>
    </section>
  );
}
