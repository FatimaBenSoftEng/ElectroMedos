import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronDown, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import styles from './NavBar.module.css';
const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/about', label: 'À propos' },
  { to: '/products?ordering=-created_at', label: 'Nouveautés' },
];
export default function NavBar({ categories = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname + location.search === to || location.pathname === to.split('?')[0];
  };
  return (
    <nav className={styles.navbar} aria-label="Navigation principale">
      <div className={`container ${styles.inner}`}>
        {/*
        <div
          className={styles.categories}
          onMouseEnter={() => setCatOpen(true)}
          onMouseLeave={() => setCatOpen(false)}
        >
          <button type="button" className={styles.catBtn} aria-expanded={catOpen}>
            <FiMenu />
            Catégories
            <FiChevronDown className={styles.chevron} />
          </button>
          {catOpen && categories.length > 0 && (
            <ul className={styles.dropdown}>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.slug}`} onClick={() => setCatOpen(false)}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        */}
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <FiX /> : <FiMenu />}
        </button>
        <ul className={`${styles.links} ${mobileOpen ? styles.linksOpen : ''}`}>
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={isActive(link.to) ? styles.active : ''}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isAuthenticated && (
            <li>
              <Link to="/orders" onClick={() => setMobileOpen(false)}>Mes commandes</Link>
            </li>
            
          )}
          <li>
          <Link to="/contact" onClick={() => setMobileOpen(false)}>
            Contactez-nous
          </Link>
         </li>
          {isAdmin && (
            <li>
              <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}