import { useAuth } from '../../context/AuthContext';
import styles from './AdminProfilePage.module.css';

export default function AdminProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  // Fonction pour obtenir les initiales
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Récupérer le nom complet
  const getUserName = () => {
    if (!user) return 'Utilisateur';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || 'Utilisateur';
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.pageHeader}>
        <h1>Mon profil</h1>
        <p>Gérez vos informations personnelles</p>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {user?.avatar ? (
              <img src={user.avatar} alt={getUserName()} />
            ) : (
              <div className={styles.profileAvatarPlaceholder}>
                {getInitials(getUserName())}
              </div>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h2>{getUserName()}</h2>
            <p>{user?.email || 'Email non défini'}</p>
            <span className={styles.profileRole}>
              {user?.is_staff ? 'Administrateur' : user?.is_superuser ? 'Super Admin' : 'Utilisateur'}
            </span>
          </div>
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.detailItem}>
            <label>Nom d'utilisateur</label>
            <span>{user?.username || 'Non défini'}</span>
          </div>
          <div className={styles.detailItem}>
            <label>Email</label>
            <span>{user?.email || 'Non défini'}</span>
          </div>
          <div className={styles.detailItem}>
            <label>Prénom</label>
            <span>{user?.first_name || 'Non défini'}</span>
          </div>
          <div className={styles.detailItem}>
            <label>Nom</label>
            <span>{user?.last_name || 'Non défini'}</span>
          </div>
          <div className={styles.detailItem}>
            <label>Rôle</label>
            <span>{user?.is_staff ? 'Administrateur' : 'Utilisateur'}</span>
          </div>
          <div className={styles.detailItem}>
            <label>ID Utilisateur</label>
            <span>#{user?.id || 'Non défini'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}