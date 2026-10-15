import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiHeart,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiLogOut
} from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import styles from './Header.module.css';

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

        <Link to="/" className={styles.logo}>
          <img
            src="/images/logo.jpg"
            alt="ElectroMedos"
            className={styles.logoImage}
          />

          <span className={styles.logoText}>
            Electro<span>Medos</span>
          </span>
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
                <strong>Connexion</strong>
              </div>
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
                <FiUser />

                <div className={styles.actionText}>
                  <strong>
                    {user?.first_name || user?.username}
                  </strong>
                </div>
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
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiPackage />
                  <span>Mes commandes</span>
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
            to="/wishlist"
            className={styles.actionIcon}
          >
            <FiHeart />

            {wishlistCount > 0 && (
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