import { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../../components/common/Loader';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import styles from './AdminCategoriesPage.module.css';

const emptyForm = { name: '', description: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const { notify } = useNotification();

  const load = () => {
    setLoading(true);
    productService.adminGetCategories()
      .then(({ data }) => setCategories(data.results || data))
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await productService.adminUpdateCategory(editing, form);
        notify('Catégorie mise à jour', 'success');
      } else {
        await productService.adminCreateCategory(form);
        notify('Catégorie créée', 'success');
      }
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat.slug);
    setForm({ name: cat.name, description: cat.description || '' });
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await productService.adminDeleteCategory(slug);
      notify('Catégorie supprimée', 'info');
      load();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.categoriesPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Catégories</h1>
          <p className={styles.pageSubtitle}>Gérez les catégories de produits</p>
        </div>
        <div className={styles.statsBadge}>
          <span className={styles.statsBadgeNumber}>{categories.length}</span>
          <span className={styles.statsBadgeLabel}>catégories</span>
        </div>
      </div>

      <div className={styles.categoriesLayout}>
        {/* Formulaire */}
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
            {editing && (
              <button 
                className={styles.cancelBtn}
                onClick={() => { setEditing(null); setForm(emptyForm); }}
              >
                Annuler
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Nom <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Ex: Électronique"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description de la catégorie..."
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>
                {editing ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>

        {/* Liste des catégories */}
        <div className={styles.tableWrapper}>
          <table className={styles.modernTable}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Slug</th>
                <th>Produits</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.categoryCell}>
                      <FolderOpen size={18} className={styles.categoryIcon} />
                      <span className={styles.categoryName}>{c.name}</span>
                    </div>
                  </td>
                  <td className={styles.categorySlug}>{c.slug}</td>
                  <td>
                    <span className={styles.productCount}>{c.product_count || 0}</span>
                  </td>
                  <td>
                    <div className={styles.actionsGroup}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleEdit(c)}
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleDelete(c.slug)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}