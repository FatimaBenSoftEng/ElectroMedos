import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState('2024-05-12');
  const [endDate, setEndDate] = useState('2024-05-18');
  const datePickerRef = useRef(null);

  const stats = [
    { label: 'Ventes totales', value: '25 860,50 €', change: '+15,8%', icon: '💰' },
    { label: 'Commandes', value: '342', change: '+12,4%', icon: '🛒' },
    { label: 'Clients', value: '1 253', change: '+8,7%', icon: '👤' },
    { label: 'Panier moyen', value: '75,59 €', change: '+15,2%', icon: '📦' },
  ];

  const recentOrders = [
    { id: '#12621', client: 'Marie Dupont', date: '18 mai 2024', status: 'Livrée', total: '129,90 €' },
    { id: '#12620', client: 'Thomas Bernard', date: '18 mai 2024', status: 'Expédiée', total: '89,00 €' },
    { id: '#12619', client: 'Sophie Leroy', date: '17 mai 2024', status: 'En préparation', total: '45,50 €' },
    { id: '#12618', client: 'Lucas Moreau', date: '17 mai 2024', status: 'En attente', total: '199,00 €' },
    { id: '#12617', client: 'Chloé Petit', date: '17 mai 2024', status: 'Annulée', total: '75,00 €' },
  ];

  const topProducts = [
    { name: 'Tensiomètre Pro', sales: '523 ventes', total: '18 960,30 €' },
    { name: 'Oxymètre Digital', sales: '487 ventes', total: '14 610,00 €' },
    { name: 'Thermomètre Infrarouge', sales: '395 ventes', total: '11 820,20 €' },
    { name: 'Nébuliseur Compact', sales: '312 ventes', total: '4 680,30 €' },
    { name: 'Glucomètre Kit', sales: '298 ventes', total: '4 470,30 €' },
  ];

  const statusClass = {
    'Livrée': styles.statusDelivered,
    'Expédiée': styles.statusShipped,
    'En préparation': styles.statusPreparing,
    'En attente': styles.statusPending,
    'Annulée': styles.statusCancelled,
  };

  // Fonction pour formater la date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Fonction pour obtenir le libellé de la période
  const getDateRangeLabel = () => {
    if (!startDate || !endDate) return 'Sélectionner une période';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Gérer le changement de date
  const handleDateChange = (e, type) => {
    if (type === 'start') {
      setStartDate(e.target.value);
    } else {
      setEndDate(e.target.value);
    }
  };

  // Appliquer la période
  const applyDateRange = () => {
    setIsDatePickerOpen(false);
    // Ici vous pouvez faire un appel API pour rafraîchir les données
    console.log('Période sélectionnée:', startDate, 'à', endDate);
  };

  // Fermer le sélecteur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction d'exportation
  const handleExport = () => {
    // Créer les données à exporter
    const exportData = {
      period: `${getDateRangeLabel()}`,
      stats: stats,
      recentOrders: recentOrders,
      topProducts: topProducts,
    };

    // Exporter en CSV
    let csvContent = 'Données du tableau de bord\n\n';
    csvContent += 'Période: ' + getDateRangeLabel() + '\n\n';
    
    csvContent += 'Statistiques\n';
    csvContent += 'Indicateur,Valeur,Évolution\n';
    stats.forEach(s => {
      csvContent += `${s.label},${s.value},${s.change}\n`;
    });
    
    csvContent += '\nCommandes récentes\n';
    csvContent += 'Commande,Client,Date,Statut,Total\n';
    recentOrders.forEach(o => {
      csvContent += `${o.id},${o.client},${o.date},${o.status},${o.total}\n`;
    });
    
    csvContent += '\nProduits les plus vendus\n';
    csvContent += 'Produit,Ventes,Total\n';
    topProducts.forEach(p => {
      csvContent += `${p.name},${p.sales},${p.total}\n`;
    });

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminPageHeader}>
        <div>
          <h1>Tableau de bord</h1>
          {/* <p className={styles.adminPageSubtitle}>Bonjour Sarah, voici ce qui se passe dans votre boutique aujourd'hui.</p> */}
        </div>
        <div className={styles.adminPageActions}>
          <div className={styles.dateRangeWrapper} ref={datePickerRef}>
            <button 
              className={styles.dateRangeBtn}
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            >
              📅 {getDateRangeLabel()} ▾
            </button>
            
            {isDatePickerOpen && (
              <div className={styles.datePickerDropdown}>
                <div className={styles.datePickerContent}>
                  <div className={styles.datePickerGroup}>
                    <label>Date de début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleDateChange(e, 'start')}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.datePickerGroup}>
                    <label>Date de fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateChange(e, 'end')}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.datePickerActions}>
                    <button 
                      className={styles.datePickerApplyBtn}
                      onClick={applyDateRange}
                    >
                      Appliquer
                    </button>
                    <button 
                      className={styles.datePickerCancelBtn}
                      onClick={() => setIsDatePickerOpen(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className={`${styles.adminBtn} ${styles.adminBtnPrimary}`}
            onClick={handleExport}
          >
            ⬇ Exporter
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className={styles.adminStats}>
        {stats.map((s) => (
          <div className={`${styles.adminStatCard} card`} key={s.label}>
            <div className={styles.adminStatCardTop}>
              <span className={styles.adminStatCardLabel}>{s.label}</span>
              <span className={styles.adminStatCardIcon}>{s.icon}</span>
            </div>
            <div className={styles.adminStatCardValue}>{s.value}</div>
            <div className={styles.adminStatCardChange}>↑ {s.change}</div>
          </div>
        ))}
      </div>

      {/* Recent orders + Top products */}
      <div className={styles.adminGrid}>
        <div className={`${styles.adminPanel} card`}>
          <div className={styles.adminPanelHeader}>
            <h3>Commandes récentes</h3>
            <Link to="/admin/orders" className={styles.adminLink}>Voir toutes</Link>
          </div>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className={styles.adminTableId}>{o.id}</td>
                  <td>{o.client}</td>
                  <td>{o.date}</td>
                  <td>
                    <span className={`${styles.adminBadge} ${statusClass[o.status]}`}>{o.status}</span>
                  </td>
                  <td>{o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${styles.adminPanel} card`}>
          <div className={styles.adminPanelHeader}>
            <h3>Produits les plus vendus</h3>
            <Link to="/admin/products" className={styles.adminLink}>Voir tous</Link>
          </div>
          <ul className={styles.adminTopProducts}>
            {topProducts.map((p, i) => (
              <li key={p.name}>
                <span className={styles.adminTopProductsRank}>{i + 1}</span>
                <div className={styles.adminTopProductsInfo}>
                  <span className={styles.adminTopProductsName}>{p.name}</span>
                  <span className={styles.adminTopProductsSales}>{p.sales}</span>
                </div>
                <span className={styles.adminTopProductsTotal}>{p.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick access cards */}
      <div className={styles.adminCards}>
        <Link to="/admin/products" className={`${styles.adminCard} card`}>
          <span className={styles.adminCardIcon}>📦</span>
          <h3>Produits</h3>
          <p>Gérer le catalogue produits</p>
        </Link>
        <Link to="/admin/categories" className={`${styles.adminCard} card`}>
          <span className={styles.adminCardIcon}>🏷️</span>
          <h3>Catégories</h3>
          <p>Organiser les catégories</p>
        </Link>
        <Link to="/admin/orders" className={`${styles.adminCard} card`}>
          <span className={styles.adminCardIcon}>📋</span>
          <h3>Commandes</h3>
          <p>Suivre et mettre à jour les statuts</p>
        </Link>
      </div>
    </div>
  );
}