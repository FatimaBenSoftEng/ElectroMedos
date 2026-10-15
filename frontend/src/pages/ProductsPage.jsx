import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ProductGrid from '../components/products/ProductGrid';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import styles from './ProductsPage.module.css';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Nouveautés' },
  { value: '-popularity', label: 'Meilleures ventes' },
  { value: '-discount_percent', label: 'Meilleures promotions' },
  { value: '-rating', label: 'Mieux notés' },
  { value: 'price', label: 'Prix : du moins cher' },
  { value: '-price', label: 'Prix : du plus cher' },
];

// Ex : 1 … 4 5 6 … 12
const heroContainer = { show: { transition: { staggerChildren: 0.12 } } };
const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function getPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = [1, total, current - 1, current, current + 1]
    .filter((p) => p >= 1 && p <= total);
  const sorted = [...new Set(wanted)].sort((a, b) => a - b);
  const list = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) list.push(`gap-${p}`);
    list.push(p);
  });
  return list;
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { notify } = useNotification();
  const reduceMotion = useReducedMotion();

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const ordering = searchParams.get('ordering') || '-created_at';
  const page = searchParams.get('page') || '1';
  const currentPage = Number(page) || 1;

  const minP = searchParams.get('min_price') || '';
  const maxP = searchParams.get('max_price') || '';
  const inStock = searchParams.get('in_stock') === 'true';
  const onSale = searchParams.get('on_sale') === 'true';
  const featured = searchParams.get('featured') === 'true';

  const [searchInput, setSearchInput] = useState(search);
  const [minPrice, setMinPrice] = useState(minP);
  const [maxPrice, setMaxPrice] = useState(maxP);

  // garde les champs synchronisés avec l'URL (ex : bouton « Tout effacer »)
  useEffect(() => {
    setSearchInput(search);
    setMinPrice(minP);
    setMaxPrice(maxP);
  }, [search, minP, maxP]);

  // menu de tri : fermeture au clic extérieur et avec Échap
  const sortRef = useRef(null);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    if (!sortOpen) return undefined;
    const onDown = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

  useEffect(() => {
    productService.getCategories().then(({ data }) => {
      setCategories(data.results || data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, ordering };
    if (category) params.category = category;
    if (search) params.search = search;
    if (minP) params.min_price = minP;
    if (maxP) params.max_price = maxP;
    if (inStock) params.in_stock = true;
    if (onSale) params.on_sale = true;
    if (featured) params.featured = true;

    productService
      .getProducts(params)
      .then(({ data }) => {
        setProducts(data.results || data);
        setTotalCount(data.count || (data.results || data).length);
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [category, search, ordering, page, minP, maxP, inStock, onSale, featured, notify]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const applyPrice = () => {
    const next = new URLSearchParams(searchParams);
    if (minPrice) next.set('min_price', minPrice);
    else next.delete('min_price');
    if (maxPrice) next.set('max_price', maxPrice);
    else next.delete('max_price');
    next.delete('page');
    setSearchParams(next);
  };

  const toggleParam = (key, current) => updateParam(key, current ? '' : 'true');

  const goToPage = (p) => {
    updateParam('page', String(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => setSearchParams(new URLSearchParams());

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const activeCategory = categories.find((c) => c.slug === category);
  const hasFilters = Boolean(category || search || minP || maxP || inStock || onSale || featured);
  const isEmpty = !loading && products.length === 0;
  const currentSort = SORT_OPTIONS.find((o) => o.value === ordering) || SORT_OPTIONS[0];

  const pillTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 500, damping: 38 };

  const categoryItems = [
    { key: 'all', slug: '', name: 'Toutes les catégories' },
    ...categories.map((c) => ({ key: c.id, slug: c.slug, name: c.name })),
  ];

  return (
    <>
      <motion.section
        className={styles.hero}
        variants={heroContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
       {/*  <motion.span className={styles.heroBadge} variants={heroItem}>
          Notre catalogue
        </motion.span> */}
        <motion.h1 className={styles.heroTitle} variants={heroItem}>
          Découvrez nos <span className={styles.heroAccent}>produits</span>
        </motion.h1>
       {/*  <motion.p className={styles.heroText} variants={heroItem}>
          Ordinateurs, smartphones, gaming, audio et accessoires au meilleur prix.
        </motion.p> */}
      </motion.section>

      <div className={`container page ${styles.productsPage}`}>
        <div className={styles.layout}>
          {/* ---------- Colonne gauche : catégories + filtres ---------- */}
          <aside className={styles.sidebar} aria-label="Catégories">
            <h2 className={styles.sidebarTitle}>Catégories</h2>
            <div className={styles.catList}>
              {categoryItems.map((item) => {
                const active = category === item.slug;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.catBtn}${active ? ` ${styles.isActive}` : ''}`}
                    aria-pressed={active}
                    onClick={() => updateParam('category', item.slug)}
                  >
                    {active && (
                      <motion.span
                        layoutId="category-pill"
                        className={styles.catPill}
                        transition={pillTransition}
                      />
                    )}
                    <span className={styles.catLabel}>{item.name}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.filters}>
              <h3 className={styles.filterTitle}>Prix (DH)</h3>
              <div className={styles.priceRow}>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Min"
                  className={styles.priceInput}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span>–</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Max"
                  className={styles.priceInput}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <button type="button" className={styles.applyBtn} onClick={applyPrice}>
                Appliquer
              </button>

              <h3 className={styles.filterTitle}>Offres</h3>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={() => toggleParam('on_sale', onSale)}
                />
                En promotion
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={() => toggleParam('in_stock', inStock)}
                />
                En stock
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={() => toggleParam('featured', featured)}
                />
                Produits vedettes
              </label>
            </div>
          </aside>

          {/* ---------- Colonne droite : résultats ---------- */}
          <section className={styles.main}>
            <div className={styles.resultsBar}>
              <div className={styles.resultsInfo}>
                <p className={styles.count} aria-live="polite">
                  {loading
                    ? 'Chargement…'
                    : `${totalCount} produit${totalCount > 1 ? 's' : ''}`}
                </p>

                <AnimatePresence initial={false}>
                  {activeCategory && (
                    <motion.button
                      key="tag-category"
                      type="button"
                      className={styles.tag}
                      onClick={() => updateParam('category', '')}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.18 }}
                    >
                      {activeCategory.name}
                      <span className={styles.tagClose} aria-label="Retirer le filtre">×</span>
                    </motion.button>
                  )}
                  {search && (
                    <motion.button
                      key="tag-search"
                      type="button"
                      className={styles.tag}
                      onClick={() => updateParam('search', '')}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.18 }}
                    >
                      « {search} »
                      <span className={styles.tagClose} aria-label="Retirer la recherche">×</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {hasFilters && (
                  <button type="button" className={styles.clearAll} onClick={resetFilters}>
                    Tout effacer
                  </button>
                )}
              </div>

              <form className={styles.searchForm} onSubmit={submitSearch} role="search">
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Rechercher un produit…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Rechercher un produit"
                />
                <button type="submit" className={styles.searchBtn}>Rechercher</button>
              </form>

              <div className={styles.sort} ref={sortRef}>
                <span className={styles.sortLabel} id="sort-label">Trier par</span>
                <div className={styles.sortWrap}>
                  <button
                    type="button"
                    className={styles.sortBtn}
                    aria-haspopup="true"
                    aria-expanded={sortOpen}
                    aria-labelledby="sort-label"
                    onClick={() => setSortOpen((o) => !o)}
                  >
                    <span>{currentSort.label}</span>
                    <svg
                      className={`${styles.sortChevron}${sortOpen ? ` ${styles.isOpen}` : ''}`}
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      strokeLinejoin="round" aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {sortOpen && (
                      <motion.ul
                        className={styles.sortMenu}
                        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                      >
                        {SORT_OPTIONS.map((o) => (
                          <li key={o.value}>
                            <button
                              type="button"
                              className={`${styles.sortItem}${o.value === ordering ? ` ${styles.isActive}` : ''}`}
                              aria-current={o.value === ordering ? 'true' : undefined}
                              onClick={() => {
                                updateParam('ordering', o.value);
                                setSortOpen(false);
                              }}
                            >
                              {o.label}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* La clé relance l'animation à chaque nouveau résultat */}
            <motion.div
              key={loading ? 'loading' : `${category}|${search}|${ordering}|${page}|${minP}|${maxP}|${inStock}|${onSale}|${featured}`}
              className={styles.results}
              initial={loading || reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {isEmpty ? (
                <div className={styles.empty}>
                  <h2 className={styles.emptyTitle}>Aucun produit trouvé</h2>
                  <p className={styles.emptyText}>
                    Essayez un autre mot-clé ou une autre catégorie.
                  </p>
                  <button type="button" className={styles.emptyBtn} onClick={resetFilters}>
                    Voir tous les produits
                  </button>
                </div>
              ) : (
                <ProductGrid products={products} loading={loading} />
              )}
            </motion.div>

            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Pagination">
                <motion.button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                  aria-label="Page précédente"
                  whileTap={{ scale: 0.92 }}
                >
                  ‹
                </motion.button>

                {getPageList(currentPage, totalPages).map((p) =>
                  typeof p === 'string' ? (
                    <span key={p} className={styles.pageGap}>…</span>
                  ) : (
                    <motion.button
                      key={p}
                      type="button"
                      className={`${styles.pageBtn}${p === currentPage ? ` ${styles.isActive}` : ''}`}
                      aria-current={p === currentPage ? 'page' : undefined}
                      onClick={() => goToPage(p)}
                      whileTap={{ scale: 0.92 }}
                    >
                      {p}
                    </motion.button>
                  ),
                )}

                <motion.button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  aria-label="Page suivante"
                  whileTap={{ scale: 0.92 }}
                >
                  ›
                </motion.button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </>
  );
}