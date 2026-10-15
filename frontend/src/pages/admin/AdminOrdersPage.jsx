import { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { getErrorMessage } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../../components/common/Loader';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import styles from './AdminOrdersPage.module.css';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
  { value: 'processing', label: 'En cours', icon: AlertCircle, color: '#3b82f6', bg: '#dbeafe' },
  { value: 'shipped', label: 'Expédiée', icon: Truck, color: '#8b5cf6', bg: '#ede9fe' },
  { value: 'delivered', label: 'Livrée', icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
  { value: 'cancelled', label: 'Annulée', icon: XCircle, color: '#ef4444', bg: '#fee2e2' },
];

const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s.label]));

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(5);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { notify } = useNotification();

  const load = () => {
    setLoading(true);
    const params = { 
      page: currentPage,
      page_size: itemsPerPage,
      ...(statusFilter && { status: statusFilter })
    };
    orderService
      .adminGetOrders(params)
      .then(({ data }) => {
        setOrders(data.results || data);
        const count = data.count || data.length || 0;
        setTotalItems(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter, currentPage]);

  const handleStatusChange = async (orderId, status) => {
    try {
      const { data } = await orderService.adminUpdateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(data);
      notify('Statut mis à jour', 'success');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Confirmer la suppression de la commande #${orderId} ?`)) return;
    try {
      await orderService.adminDeleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      notify('Commande supprimée avec succès', 'success');
      load();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  // Fonction pour modifier le statut directement depuis le tableau
  const handleEditStatus = (order) => {
    const newStatus = window.prompt(
      `Changer le statut de la commande #${order.id}\n\nStatuts disponibles:\n- pending: En attente\n- processing: En cours\n- shipped: Expédiée\n- delivered: Livrée\n- cancelled: Annulée\n\nEntrez le nouveau statut:`,
      order.status
    );
    if (newStatus && STATUS_LABELS[newStatus]) {
      handleStatusChange(order.id, newStatus);
    } else if (newStatus) {
      notify('Statut invalide. Utilisez: pending, processing, shipped, delivered, cancelled', 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const orderId = String(order.id);
    const clientName = `${order.first_name} ${order.last_name}`.toLowerCase();
    const email = (order.user_email || order.email || '').toLowerCase();
    return orderId.includes(search) || clientName.includes(search) || email.includes(search);
  });

  const getStatusStyle = (status) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option || STATUS_OPTIONS[0];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DH';
  };

  // Pagination - Afficher toujours 5 commandes par page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Afficher les numéros de page
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

  // Ouvrir les détails
  const openDetails = (order) => {
    setSelectedOrder(order);
  };

  // Fermer les détails
  const closeDetails = () => {
    setSelectedOrder(null);
  };

  // Calculer les indices affichés
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.ordersPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Commandes</h1>
{/*           <p className={styles.pageSubtitle}>Gérer et suivre toutes les commandes</p>
 */}        </div>
        <div className={styles.statsBadge}>
          <span className={styles.statsBadgeNumber}>{totalItems}</span>
          <span className={styles.statsBadgeLabel}>commandes</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterWrapper}>
          <Filter size={18} className={styles.filterIcon} />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info pagination */}
     {/*  {totalItems > 0 && (
        <div className={styles.paginationInfo}>
          Affichage de {startIndex} à {endIndex} sur {totalItems} commandes
        </div>
      )} */}

      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📦</div>
          <h3>Aucune commande trouvée</h3>
          <p>Essayez de modifier vos filtres ou votre recherche</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th className={styles.colId}>N°</th>
                  <th className={styles.colClient}>Client</th>
                  <th className={styles.colDate}>Date</th>
                  <th className={styles.colArticles}>Articles</th>
                  <th className={styles.colTotal}>Total</th>
                  <th className={styles.colStatus}>Statut</th>
                  <th className={styles.colActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const statusStyle = getStatusStyle(order.status);
                  const displayNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr key={order.id} className={styles.tableRow}>
                      <td className={styles.colId}>
                        <span className={styles.orderNumber}>{displayNumber}</span>
                      </td>
                      <td className={styles.colClient}>
                        <div className={styles.customerCell}>
                          <div className={styles.customerAvatar}>
                            {order.first_name?.charAt(0) || order.username?.charAt(0) || 'U'}
                          </div>
                          <div className={styles.customerInfo}>
                            <span className={styles.customerName}>
                              {order.first_name} {order.last_name}
                            </span>
                            <span className={styles.customerEmail}>
                              {order.user_email || order.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.colDate}>
                        <div className={styles.dateCell}>
                          <Calendar size={14} className={styles.dateIcon} />
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className={styles.colArticles}>
                        <div className={styles.articlesCell}>
                          <Package size={14} className={styles.articlesIcon} />
                          <span>{order.items?.length || 0}</span>
                        </div>
                      </td>
                      <td className={styles.colTotal}>
                        <span className={styles.totalCell}>{formatPrice(order.total)}</span>
                      </td>
                      <td className={styles.colStatus}>
                        <span 
                          className={styles.statusBadge}
                          style={{ 
                            background: statusStyle.bg, 
                            color: statusStyle.color 
                          }}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className={styles.colActions}>
                        <div className={styles.actionsGroup}>
                          <button 
                            className={styles.actionBtn}
                            onClick={() => openDetails(order)}
                            title="Voir les détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            onClick={() => handleEditStatus(order)}
                            title="Modifier le statut"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            onClick={() => handleDeleteOrder(order.id)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
        </>
      )}

      {/* Modal Détails */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={closeDetails}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Détails de la commande #{selectedOrder.id}</h2>
              <button className={styles.modalClose} onClick={closeDetails}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailSection}>
                  <h4>Informations client</h4>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Nom</span>
                    <span>{selectedOrder.username || 'Non défini'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email</span>
                    <span>{selectedOrder.user_email || selectedOrder.email || 'Non défini'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Adresse</span>
                    <span>
                      {selectedOrder.address || 'Non définie'}, 
                      {selectedOrder.postal_code || ''} {selectedOrder.city || ''}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date</span>
                    <span>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h4>Statut de la commande</h4>
                  <div className={styles.statusUpdate}>
                    <select
                      className={styles.statusSelect}
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.detailRow} style={{ marginTop: '12px' }}>
                    <span className={styles.detailLabel}>Total</span>
                    <span className={styles.detailTotalAmount}>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detailItems}>
                <h4>Articles commandés ({selectedOrder.items?.length || 0})</h4>
                <div className={styles.itemsList}>
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className={styles.detailItem}>
                      <span className={styles.detailItemQty}>{item.quantity}x</span>
                      <span className={styles.detailItemName}>{item.product_name}</span>
                      <span className={styles.detailItemPrice}>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <div className={styles.noItems}>Aucun article dans cette commande</div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalBtnClose} onClick={closeDetails}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}