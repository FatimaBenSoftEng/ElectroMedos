import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import styles from './TopBar.module.css';

export default function TopBar() {
  return (
    <div className={styles.topbar}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.contacts}>
          <a href="tel:+33123456789" className={styles.link}>
            <FiPhone aria-hidden />
            <span>+212 06 60 00 83 27</span>
          </a>
          <a href="mailto:contact@electromedos.fr" className={styles.link}>
            <FiMail aria-hidden />
            <span>contact@electromedos.com</span>
          </a>
          <span className={`${styles.link} ${styles.location}`}>
            <FiMapPin aria-hidden />
            <span>Fès, Maroc</span>
          </span>
        </div>
        <div className={styles.promo}>
          Livraison gratuite dès 50 DH d&apos;achat
        </div>
      </div>
    </div>
  );
}
