import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Home,
  ClipboardList,
  Box,
  Users,
  Megaphone,
  LayoutGrid,
  BarChart2,
  Heart,
  Percent,
  Settings,
  MessageSquare,
  Smartphone,
  CreditCard,
  ExternalLink,
  ChevronDown,
  Globe,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Shield,
  Plus,
  List,
  Edit,
  FolderOpen, // Ajout de l'icône pour Catégories
} from 'lucide-react';
import styles from './AdminLayout.module.css';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { useState, useRef, useEffect } from 'react';

const mainLinks = [
  { to: '/admin', label: 'Tableau de bord', end: true, icon: Home },
  { to: '/admin/orders', label: 'Commandes', icon: ClipboardList },
  { 
    to: '/admin/products', 
    label: 'Produits', 
    icon: Box,
    subLinks: [
      { to: '/admin/products', label: 'Liste des produits', icon: List },
      { to: '/admin/products/create', label: 'Nouveau produit', icon: Plus },
      /* { to: '/admin/products/edit', label: 'Modifier produit', icon: Edit }, */
      { to: '/admin/categories', label: 'Catégories', icon: FolderOpen }, // Ajout de Catégories
    ]
  },
  { to: '/admin/customers', label: 'Clients', icon: Users },
  { to: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/admin/content', label: 'Contenu', icon: LayoutGrid },
  { to: '/admin/analytics', label: 'Analyses', icon: BarChart2 },
  { to: '/admin/reviews', label: 'Avis', icon: Heart },
  { to: '/admin/discounts', label: 'Réductions', icon: Percent },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
];

const salesChannels = [
  { to: '/admin/store', label: 'Boutique en ligne', icon: MessageSquare, external: true },
  { to: '/admin/mobile-app', label: 'App mobile', icon: Smartphone },
  { to: '/admin/pos', label: 'Point de vente', icon: CreditCard },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [ordersCount, setOrdersCount] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const dropdownRef = useRef(null);
  const prevActiveSectionRef = useRef(null);

  // Appliquer le mode sombre
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Récupérer le vrai nombre de commandes pour le badge de la sidebar
  useEffect(() => {
    orderService
      .adminGetOrders({ page: 1, page_size: 1 })
      .then(({ data }) => {
        const count = data.count ?? (data.results || data).length ?? 0;
        setOrdersCount(count);
      })
      .catch(() => setOrdersCount(null));
  }, []);

  const isActive = (to, end) => {
    if (end) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const isSubLinkActive = (subLinks) => {
    return subLinks?.some(link => location.pathname === link.to);
  };

  // Ouvre automatiquement une section SEULEMENT quand on y entre pour la première fois,
  // et replie les autres sections qu'on quitte. Le clic manuel reste libre d'ouvrir/fermer
  // une fois qu'on est déjà dans la section.
  useEffect(() => {
    const activeLink = mainLinks.find(
      (link) => link.subLinks && (isActive(link.to, link.end) || isSubLinkActive(link.subLinks))
    );
    const activeLabel = activeLink ? activeLink.label : null;

    setExpandedMenus((prev) => {
      const next = { ...prev };
      mainLinks.forEach((link) => {
        if (link.subLinks && link.label !== activeLabel) {
          next[link.label] = false;
        }
      });
      if (activeLabel && activeLabel !== prevActiveSectionRef.current) {
        next[activeLabel] = true;
      }
      return next;
    });

    prevActiveSectionRef.current = activeLabel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Basculer le mode sombre
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Fonction pour obtenir les initiales de l'utilisateur
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Récupérer le nom complet de l'utilisateur
  const getUserName = () => {
    if (!user) return 'Utilisateur';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || 'Utilisateur';
  };

  // Récupérer le rôle de l'utilisateur
  const getUserRole = () => {
    if (!user) return 'Invité';
    if (user.is_staff) return 'Administrateur';
    if (user.is_superuser) return 'Super Admin';
    return 'Utilisateur';
  };

  // Récupérer l'avatar
  const getAvatarUrl = () => {
    if (!user) return null;
    if (user.avatar) return user.avatar;
    return null;
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Basculer le dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className={`${styles.adminLayout} ${isDarkMode ? styles.darkMode : ''}`}>
      <aside className={`${styles.sidebar} ${isDarkMode ? styles.sidebarDark : ''}`}>
        <div className={styles.brand}>
          <ShoppingBag size={20} className={styles.brandIcon} />
          <span className={styles.brandName}>ElectroMedos</span>
        </div>

        <nav className={styles.nav}>
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const hasSubLinks = link.subLinks && link.subLinks.length > 0;
            const isExpanded = !!expandedMenus[link.label];
            const isLinkActive = isActive(link.to, link.end);
            const isGroupActive = isLinkActive || isSubLinkActive(link.subLinks);

            if (hasSubLinks) {
              return (
                <div key={link.to} className={styles.navGroup}>
                  <div
                    className={`${styles.navLink} ${isGroupActive ? styles.navLinkActive : ''}`}
                    onClick={() => {
                      toggleMenu(link.label);
                      navigate(link.to);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon size={18} className={styles.navIcon} />
                    <span className={styles.navLabel}>{link.label}</span>
                    {link.badge && <span className={styles.navBadge}>{link.badge}</span>}
                    <ChevronDown 
                      size={16} 
                      className={`${styles.navChevron} ${isExpanded ? styles.navChevronRotated : ''}`}
                    />
                  </div>
                  {isExpanded && (
                    <div className={styles.subNav}>
                      {link.subLinks.map((subLink) => {
                        const SubIcon = subLink.icon;
                        const isSubActive = location.pathname === subLink.to;
                        return (
                          <Link
                            key={subLink.to}
                            to={subLink.to}
                            className={`${styles.subNavLink} ${isSubActive ? styles.subNavLinkActive : ''}`}
                          >
                            <SubIcon size={16} className={styles.subNavIcon} />
                            <span>{subLink.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`${styles.navLink} ${isActive(link.to, link.end) ? styles.navLinkActive : ''}`}
              >
                <Icon size={18} className={styles.navIcon} />
                <span className={styles.navLabel}>{link.label}</span>
                {link.to === '/admin/orders' && ordersCount !== null && (
                  <span className={styles.navBadge}>{ordersCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sectionLabel}>Canaux de vente</div>
        <nav className={styles.nav}>
          {salesChannels.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`${styles.navLink} ${isActive(link.to) ? styles.navLinkActive : ''}`}
              >
                <Icon size={18} className={styles.navIcon} />
                <span className={styles.navLabel}>{link.label}</span>
                {link.external && <ExternalLink size={14} className={styles.externalIcon} />}
              </Link>
            );
          })}
        </nav>

        {/* Lien Retour au site web */}
        <div className={styles.returnToSite}>
          <a href="/" className={styles.returnLink}>
            <Globe size={18} className={styles.returnIcon} />
            <span className={styles.returnLabel}>Retour au site</span>
            <ExternalLink size={14} className={styles.externalIcon} />
          </a>
        </div>
      </aside>

      <div className={`${styles.content} ${isDarkMode ? styles.contentDark : ''}`}>
        <header className={`${styles.topBar} ${isDarkMode ? styles.topBarDark : ''}`}>
          <div className={`${styles.search} ${isDarkMode ? styles.searchDark : ''}`}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Rechercher..." className={`${styles.searchInput} ${isDarkMode ? styles.searchInputDark : ''}`} />
            <span className={styles.searchShortcut}>⌘ K</span>
          </div>

          <div className={styles.actions}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <Bell size={20} />
              <span className={styles.badge}>3</span>
            </button>
            <button 
              className={styles.iconBtn} 
              aria-label="Mode sombre"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Profile dans la topbar */}
            <div className={styles.userProfileWrapper} ref={dropdownRef}>
              <div className={styles.userProfile} onClick={toggleDropdown}>
                {isAuthenticated && user ? (
                  <>
                    {getAvatarUrl() ? (
                      <img
                        src={getAvatarUrl()}
                        alt={getUserName()}
                        className={styles.userProfileAvatar}
                      />
                    ) : (
                      <div className={styles.userProfileAvatarPlaceholder}>
                        {getInitials(getUserName())}
                      </div>
                    )}
                    <div className={styles.userProfileInfo}>
                      <span className={styles.userProfileName}>{getUserName()}</span>
                      <span className={styles.userProfileRole}>{getUserRole()}</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`${styles.userProfileChevron} ${isDropdownOpen ? styles.userProfileChevronRotated : ''}`}
                    />
                  </>
                ) : (
                  <>
                    <div className={styles.userProfileAvatarPlaceholder}>?</div>
                    <span className={styles.userProfileName}>Invité</span>
                  </>
                )}
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && isAuthenticated && (
                <div className={`${styles.dropdownMenu} ${isDarkMode ? styles.dropdownMenuDark : ''}`}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownUserInfo}>
                      {getAvatarUrl() ? (
                        <img
                          src={getAvatarUrl()}
                          alt={getUserName()}
                          className={styles.dropdownAvatar}
                        />
                      ) : (
                        <div className={styles.dropdownAvatarPlaceholder}>
                          {getInitials(getUserName())}
                        </div>
                      )}
                      <div>
                        <div className={styles.dropdownUserName}>{getUserName()}</div>
                        <div className={styles.dropdownUserRole}>{getUserRole()}</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link to="/admin/profile" className={styles.dropdownItem}>
                    <User size={16} />
                    <span>Mon profil</span>
                  </Link>
                  <Link to="/admin/settings" className={styles.dropdownItem}>
                    <Shield size={16} />
                    <span>Paramètres</span>
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
                    <LogOut size={16} />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`${styles.pageArea} ${isDarkMode ? styles.pageAreaDark : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}