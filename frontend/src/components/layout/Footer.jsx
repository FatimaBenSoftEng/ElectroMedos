import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone, FiTwitter } from 'react-icons/fi';
import { FaYoutube, FaTiktok } from 'react-icons/fa6';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.column}>
          <Link to="/" className={styles.logo} aria-label="ElectroMedos - Accueil">
            <img src="/images/LogoEM.png" alt="ElectroMedos" className={styles.logoImage} />
          </Link>
          <p className={styles.desc}>
            Votre boutique en ligne d'électronique. Qualité, prix compétitifs et livraison rapide partout au Maroc.
          </p>
          <div className={styles.social}>
            <a href="https://www.facebook.com/electromedos" aria-label="Facebook"><FiFacebook /></a>
            <a href="https://twitter.com/electromedos" aria-label="Twitter"><FiTwitter /></a>
            <a href="https://www.instagram.com/electromedos" aria-label="Instagram"><FiInstagram /></a>
            <a href="https://www.youtube.com/@electromedos" aria-label="YouTube"><FaYoutube /></a>
            <a href="https://www.tiktok.com/@electromedos" aria-label="TikTok"><FaTiktok /></a>
          </div>
        </div>

        <div className={styles.column}>
          <h4>Liens rapides</h4>
          <Link to="/">Accueil</Link>
          <Link to="/about">À propos</Link>
          <Link to="/products?ordering=-created_at">Nouveautés </Link>
          <Link to="/contact">Contact</Link>
          <Link to="/cart">Panier</Link>
        </div>

        <div className={styles.column}>
          <h4>Mon compte</h4>
          <Link to="/login">Connexion</Link>
          <Link to="/register">Inscription</Link>
          <Link to="/profile?tab=commandes">Mes commandes</Link>
          <Link to="/profile">Mon profil</Link>
        </div>

        <div className={styles.column}>
          <h4>Contact</h4>
          <p><FiMapPin aria-hidden /> 12 rue de Rivoli, 75001 Maroc</p>
          <p><FiPhone aria-hidden /> +212 06 60 00 83 27</p>
          <p><FiMail aria-hidden /> contact@electromedos.com</p>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} ElectroMedos. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}