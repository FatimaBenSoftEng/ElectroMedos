import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { customerService } from '../../services/customerService';
import { getErrorMessage } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { ChevronLeft, ChevronRight, X, User, Mail, Phone, MapPin, Calendar, ShoppingBag, CreditCard, Package } from 'lucide-react';
import styles from './AdminCustomersPage.module.css';

const statusLabels = {
  true: 'Actif',
  false: 'Désactivé',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { notify } = useNotification();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(5);

  // Fonction pour générer une couleur aléatoire mais cohérente pour l'avatar
  const getAvatarColor = (name) => {
    const colors = [
      '#6C5CE7', '#00B894', '#00CEC9', '#0984E3', '#6C5CE7',
      '#FD79A8', '#FDCB6E', '#E17055', '#00B894', '#0984E3'
    ];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const loadCustomers = () => {
    setLoading(true);
    const params = {
      page: currentPage,
      page_size: itemsPerPage,
    };
    if (search) params.search = search;
    if (statusFilter) params.is_active = statusFilter;

    customerService.adminGetCustomers(params)
      .then(({ data }) => {
        const customersData = data.results || data;
        setCustomers(customersData);
        const count = data.count || customersData.length || 0;
        setTotalItems(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter, currentPage]);

  const handleSelect = (customer) => {
    setSelected(customer);
    setShowModal(true);
  };

  const toggleActive = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const { data } = await customerService.adminUpdateCustomer(selected.id, {
        is_active: !selected.is_active,
      });
      setSelected(data);
      setCustomers((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      notify('État du compte mis à jour.', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
  };

  // Pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Calculer les indices affichés
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.adminCustomersPage}>
      <div className={styles.adminPageHeader}>
        <div>
          <h1>Clients</h1>
        </div>
        <div className={styles.statsBadge}>
          <span className={styles.statsBadgeNumber}>{totalItems}</span>
          <span className={styles.statsBadgeLabel}>clients</span>
        </div>
      </div>

      <div className={styles.adminToolbar}>
        <label className={styles.adminToolbarField}>
          Recherche
          <input
            type="text"
            className={styles.adminInput}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Nom, email, téléphone..."
          />
        </label>
        <label className={styles.adminToolbarField}>
          Statut
          <select
            className={styles.adminSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Désactivés</option>
          </select>
        </label>
      </div>

      <div className={styles.adminCustomersLayout}>
        <div className={styles.tableWrapper}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Inscription</th>
                <th>Commandes</th>
                <th>Total dépensé</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const avatarColor = getAvatarColor(customer.full_name || customer.username);
                const initial = (customer.full_name || customer.username || 'U').charAt(0).toUpperCase();
                
                return (
                  <tr
                    key={customer.id}
                    className={selected?.id === customer.id ? styles.rowActive : ''}
                    onClick={() => handleSelect(customer)}
                  >
                    <td>
                      <div className={styles.customerCell}>
                        <div 
                          className={styles.customerAvatar}
                          style={{ backgroundColor: avatarColor }}
                        >
                          {initial}
                        </div>
                        <div>
                          <strong>{customer.full_name || customer.username}</strong>
                          <br />
                          {/* <small>{customer.is_staff ? 'Modérateur' : 'Client'}</small> */}
                        </div>
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>{new Date(customer.date_joined).toLocaleDateString('fr-FR')}</td>
                    <td>{customer.order_count || 0}</td>
                    <td>{Number(customer.total_spent || 0).toFixed(2)} €</td>
                    <td>
                      <span className={`${styles.statusBadge} ${customer.is_active ? styles.statusActive : styles.statusInactive}`}>
                        {statusLabels[String(customer.is_active)]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationBtn}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Précédent
              </button>

              <div className={styles.paginationPages}>
                {currentPage > 3 && totalPages > 5 && (
                  <>
                    <button
                      className={styles.paginationPage}
                      onClick={() => goToPage(1)}
                    >
                      1
                    </button>
                    <span className={styles.paginationDots}>…</span>
                  </>
                )}
                
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={`${styles.paginationPage} ${currentPage === page ? styles.paginationPageActive : ''}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}
                
                {currentPage < totalPages - 2 && totalPages > 5 && (
                  <>
                    <span className={styles.paginationDots}>…</span>
                    <button
                      className={styles.paginationPage}
                      onClick={() => goToPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                className={styles.paginationBtn}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails Client */}
      {showModal && selected && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Détails du client</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalUserHeader}>
                <div className={styles.modalUserAvatar}>
                  {(selected.full_name || selected.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className={styles.modalUserInfo}>
                  <h3>{selected.full_name || selected.username}</h3>
                  <div className={styles.modalUserBadges}>
                    <span className={`${styles.statusBadge} ${selected.is_active ? styles.statusActive : styles.statusInactive}`}>
                      {statusLabels[String(selected.is_active)]}
                    </span>
                    <span className={styles.modalUserRole}>{selected.is_staff ? 'Modérateur' : 'Client'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>INFORMATIONS CLIENT</h4>
                <div className={styles.modalInfoGrid}>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Nom</span>
                    <span className={styles.modalInfoValue}>{selected.full_name || selected.username || '—'}</span>
                  </div>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Email</span>
                    <span className={styles.modalInfoValue}>{selected.email || '—'}</span>
                  </div>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Téléphone</span>
                    <span className={styles.modalInfoValue}>{selected.phone || '—'}</span>
                  </div>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Adresse</span>
                    <span className={styles.modalInfoValue}>{selected.address || '—'}</span>
                  </div>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Date d'inscription</span>
                    <span className={styles.modalInfoValue}>
                      {new Date(selected.date_joined).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>COMMANDES ({selected.order_count || 0})</h4>
                <div className={styles.modalInfoGrid}>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Nombre de commandes</span>
                    <span className={styles.modalInfoValue}>{selected.order_count || 0}</span>
                  </div>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Total dépensé</span>
                    <span className={styles.modalInfoValue}>{Number(selected.total_spent || 0).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>STATUT DU COMPTE</h4>
                <div className={styles.modalInfoGrid}>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Statut</span>
                    <span className={`${styles.statusBadge} ${selected.is_active ? styles.statusActive : styles.statusInactive}`}>
                      {statusLabels[String(selected.is_active)]}
                    </span>
                  </div>
                  <div className={styles.modalInfoRow}>
                    <span className={styles.modalInfoLabel}>Rôle</span>
                    <span className={styles.modalInfoValue}>{selected.role || 'Client'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalActionBtn}
                disabled={updating}
                onClick={toggleActive}
              >
                {selected.is_active ? 'Désactiver le compte' : 'Activer le compte'}
              </button>
              <button type="button" className={styles.modalCloseBtn} onClick={closeModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}