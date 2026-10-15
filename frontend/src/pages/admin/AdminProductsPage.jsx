import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../../components/common/Loader';
import {
  Plus,
  Edit,
  List,
  Search,
  Trash2,
  Package,
  Eye,
  X,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './AdminProductsPage.module.css';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: 0,
  brand: '',
  is_featured: false,
  image_url: '',
  image_file: null,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(5);

  // Déterminer l'onglet actif en fonction de l'URL
  const getActiveTab = () => {
    if (location.pathname === '/admin/products/create') return 'create';
    if (location.pathname === '/admin/products/edit') return 'edit';
    return 'list';
  };

  const activeTab = getActiveTab();

  const load = () => {
    setLoading(true);
    Promise.all([
      productService.adminGetProducts({ 
        page: currentPage, 
        page_size: itemsPerPage 
      }),
      productService.adminGetCategories(),
    ])
      .then(([prodRes, catRes]) => {
        const productsData = prodRes.data.results || prodRes.data;
        setProducts(productsData);
        const count = prodRes.data.count || productsData.length || 0;
        setTotalItems(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
        setCategories(catRes.data.results || catRes.data);
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    load(); 
  }, [currentPage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Gestion du téléchargement d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Veuillez sélectionner une image valide', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify('L\'image ne doit pas dépasser 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setForm((prev) => ({ ...prev, image_file: file }));
  };

  // Supprimer l'image sélectionnée
  const removeImage = () => {
    setImagePreview(null);
    setForm((prev) => ({ ...prev, image_file: null, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Télécharger l'image vers le serveur
  const uploadImage = async (file) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await productService.uploadImage(formData);
      return response.data.url;
    } catch (error) {
      notify('Erreur lors du téléchargement de l\'image', 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = form.image_url;

    if (form.image_file) {
      const uploadedUrl = await uploadImage(form.image_file);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        return;
      }
    }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      category: parseInt(form.category, 10),
      image_url: imageUrl,
    };

    try {
      if (editing) {
        await productService.adminUpdateProduct(editing, payload);
        notify('Produit mis à jour avec succès', 'success');
      } else {
        await productService.adminCreateProduct(payload);
        notify('Produit créé avec succès', 'success');
      }
      setForm(emptyForm);
      setEditing(null);
      setImagePreview(null);
      setCurrentPage(1);
      load();
      navigate('/admin/products');
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const handleEdit = (product) => {
    setEditing(product.slug);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      stock: product.stock,
      brand: product.brand || '',
      is_featured: product.is_featured || false,
      image_url: product.display_image || '',
      image_file: null,
    });
    setImagePreview(product.display_image || null);
    navigate('/admin/products/edit');
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await productService.adminDeleteProduct(slug);
      notify('Produit supprimé avec succès', 'info');
      load();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditing(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    navigate('/admin/products');
  };

  const handleCreateNew = () => {
    setForm(emptyForm);
    setEditing(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    navigate('/admin/products/create');
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

  // Filtrer les produits par recherche
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(search) ||
           product.brand?.toLowerCase().includes(search) ||
           product.category_name?.toLowerCase().includes(search);
  });

  const formatPrice = (price) => {
    return Number(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DH';
  };

  // Calculer les indices affichés
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.productsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Produits</h1>
        </div>
        <div className={styles.statsBadge}>
          <span className={styles.statsBadgeNumber}>{totalItems}</span>
          <span className={styles.statsBadgeLabel}>produits</span>
        </div>
      </div>

      {/* Onglets */}
     {/*  <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.tabActive : ''}`}
          onClick={() => navigate('/admin/products')}
        >
          <List size={18} />
          Liste des produits
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`}
          onClick={() => navigate('/admin/products/create')}
        >
          <Plus size={18} />
          Nouveau produit
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'edit' ? styles.tabActive : ''}`}
          onClick={() => {
            if (editing) {
              navigate('/admin/products/edit');
            } else {
              notify('Veuillez d\'abord sélectionner un produit à modifier', 'info');
            }
          }}
        >
          <Edit size={18} />
          Modifier produit
        </button>
      </div> */}

      {/* Contenu des onglets */}
      <div className={styles.tabContent}>
        {/* Onglet Liste */}
        {activeTab === 'list' && (
          <div className={styles.listTab}>
            <div className={styles.toolbar}>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className={styles.searchClear}
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button 
                className={styles.createBtn}
                onClick={handleCreateNew}
              >
                <Plus size={18} />
                Nouveau produit
              </button>
            </div>

            {/* Info pagination */}
           {/*  {totalItems > 0 && (
              <div className={styles.paginationInfo}>
                Affichage de <strong>{startIndex}</strong> à <strong>{endIndex}</strong> sur <strong>{totalItems}</strong> produits
              </div>
            )} */}

            {filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={48} className={styles.emptyStateIcon} />
                <h3>Aucun produit trouvé</h3>
                <p>Ajoutez votre premier produit en cliquant sur "Nouveau produit"</p>
              </div>
            ) : (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.modernTable}>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Catégorie</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th className={styles.actionsCol}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className={styles.tableRow}>
                          <td>
                            <div className={styles.productCell}>
                              {product.display_image ? (
                                <img 
                                  src={product.display_image} 
                                  alt={product.name}
                                  className={styles.productImage}
                                />
                              ) : (
                                <div className={styles.productImagePlaceholder}>
                                  <Package size={20} />
                                </div>
                              )}
                              <div>
                                <div className={styles.productName}>{product.name}</div>
                                {product.brand && (
                                  <div className={styles.productBrand}>{product.brand}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{product.category_name || 'Non catégorisé'}</td>
                          <td className={styles.priceCell}>{formatPrice(product.price)}</td>
                          <td>
                            <span className={`${styles.stockBadge} ${product.stock === 0 ? styles.stockOut : ''}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionsGroup}>
                              <button
                                className={styles.actionBtn}
                                onClick={() => handleEdit(product)}
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                onClick={() => handleDelete(product.slug)}
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
          </div>
        )}

        {/* Onglet Créer / Modifier */}
        {(activeTab === 'create' || activeTab === 'edit') && (
          <div className={styles.formTab}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2>{editing ? 'Modifier le produit' : 'Créer un nouveau produit'}</h2>
                <button 
                  className={styles.cancelBtn}
                  onClick={handleCancel}
                >
                  <X size={16} />
                  Annuler
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Upload d'image */}
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>
                    Image du produit <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.imageUploadContainer}>
                    {imagePreview ? (
                      <div className={styles.imagePreviewWrapper}>
                        <img 
                          src={imagePreview} 
                          alt="Aperçu" 
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          className={styles.removeImageBtn}
                          onClick={removeImage}
                          title="Supprimer l'image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className={styles.imageDropZone}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon size={40} className={styles.imageDropIcon} />
                        <p>Cliquez ou glissez une image ici</p>
                        <span>PNG, JPG, JPEG jusqu'à 5MB</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className={styles.fileInput}
                    />
                    {!imagePreview && form.image_url && !form.image_file && (
                      <div className={styles.imagePreviewWrapper}>
                        <img 
                          src={form.image_url} 
                          alt="Image actuelle" 
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          className={styles.removeImageBtn}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, image_url: '' }));
                          }}
                          title="Supprimer l'image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  {isUploading && (
                    <div className={styles.uploadingIndicator}>
                      <Loader size="small" />
                      <span>Téléchargement en cours...</span>
                    </div>
                  )}
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>
                      Nom du produit <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className={styles.formInput}
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Tensiomètre Pro"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>
                      Description <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      name="description"
                      className={styles.formTextarea}
                      rows={4}
                      value={form.description}
                      onChange={handleChange}
                      required
                      placeholder="Description détaillée du produit..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Prix (DH) <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      className={styles.formInput}
                      value={form.price}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Stock <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      className={styles.formInput}
                      value={form.stock}
                      onChange={handleChange}
                      required
                      placeholder="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Catégorie <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="category"
                      className={styles.formSelect}
                      value={form.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Choisir une catégorie...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Marque
                    </label>
                    <input
                      type="text"
                      name="brand"
                      className={styles.formInput}
                      value={form.brand}
                      onChange={handleChange}
                      placeholder="Nom de la marque"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={form.is_featured}
                        onChange={handleChange}
                      />
                      Produit vedette
                    </label>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Téléchargement...' : (editing ? 'Mettre à jour' : 'Créer le produit')}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelFormBtn}
                    onClick={handleCancel}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}