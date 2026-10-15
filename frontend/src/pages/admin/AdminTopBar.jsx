import { useState } from 'react';
import styles from './AdminTopBar.module.css';

export default function AdminTopBar({ storeName = 'ElectroMedos', notificationCount = 3 }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🛍️</span>
        <span className={styles.brandName}>{storeName}</span>
      </div>

      <div className={styles.search}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher..."
          className={styles.searchInput}
        />
        <span className={styles.searchShortcut}>⌘ K</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn} aria-label="Notifications">
          🔔
          {notificationCount > 0 && (
            <span className={styles.badge}>{notificationCount}</span>
          )}
        </button>
        <button
          className={styles.iconBtn}
          aria-label="Basculer le mode sombre"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}