import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiHeart,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiLogOut,
  FiUserCheck,
  FiChevronDown
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import styles from './Header.module.css';

const chevronStyle = (open) => ({
  flexShrink: 0,
  transition: 'transform 0.2s ease',
  transform: open ? 'rotate(180deg)' : 'none',
});

export default function Header({ categories = [] }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>

        {/* ================= Logo ================= */}

        <Link to="/" className={styles.logo} aria-label="ElectroMedos - Accueil">
          <img
            src="/images/LogoEM.png"
            alt="ElectroMedos"
            className={styles.logoImage}
          />
        </Link>

        {/* ================= Recherche ================= */}

        <form
          className={styles.search}
          onSubmit={handleSearch}
        >
          <select
            className={styles.categorySelect}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                navigate(`/products?category=${e.target.value}`);
              }
            }}
          >
            <option value="">Toutes catégories</option>

            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.slug}
              >
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="search"
            className={styles.searchInput}
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="submit"
            className={styles.searchBtn}
          >
            Rechercher
          </button>
        </form>

        {/* ================= Actions ================= */}

        <div className={styles.actions}>

          {!isAuthenticated ? (
            <Link
              to="/login"
              className={styles.action}
            >
              <FiUser />

              <div className={styles.actionText}>
                <strong>Se connecter</strong>
              </div>

              <FiChevronDown className={styles.chevron} style={chevronStyle(false)} />
            </Link>
          ) : (

            <div
              className={`${styles.userMenu} ${
                menuOpen ? styles.open : ''
              }`}
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
            >

              <button
                type="button"
                className={styles.actionButton}
              >
                <FiUserCheck />

                <div className={styles.actionText}>
                  <strong>
                    Bonjour, {user?.first_name || user?.username}
                  </strong>
                </div>

                <FiChevronDown className={styles.chevron} style={chevronStyle(menuOpen)} />
              </button>

              <div className={styles.dropdown}>

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiUser />
                  <span>Mon profil</span>
                </Link>

                <Link
                  to="/profile?tab=commandes"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiPackage />
                  <span>Vos commandes</span>
                </Link>

                <Link
                  to="/profile?tab=favoris"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiHeart />
                  <span>Favoris</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                >
                  <FiLogOut />
                  <span>Déconnexion</span>
                </button>

              </div>

            </div>

          )}

          {/* Favoris */}

          <Link
            to="/profile?tab=favoris"
            className={styles.actionIcon}
          >
            <FiHeart />

            {isAuthenticated && wishlistCount > 0 && (
              <span className={styles.badge}>
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Panier */}

          <Link
            to="/cart"
            className={styles.actionIcon}
          >
            <FiShoppingCart />

            {itemCount > 0 && (
              <span className={styles.badge}>
                {itemCount}
              </span>
            )}
          </Link>

        </div>

      </div>
    </header>
  );
}