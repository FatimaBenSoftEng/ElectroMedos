import { useEffect, useMemo, useState } from 'react';
import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import ProductSection from '../components/home/ProductSection';
import PromoBanner from '../components/home/PromoBanner';
import Newsletter from '../components/home/Newsletter';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import { getProductDiscount } from '../utils/productHelpers';
import { useNotification } from '../context/NotificationContext';

// Moins de produits par section = moins de scroll
const PER_SECTION = 6;

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [popularAll, setPopularAll] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    Promise.all([
      productService.getCategories(),
      productService.getProducts({ ordering: '-popularity' }),
      productService.getProducts({ ordering: '-created_at' }),
    ])
      .then(([catRes, popRes, newRes]) => {
        setCategories(catRes.data.results || catRes.data);
        setPopularAll(popRes.data.results || popRes.data);
        setNewArrivals((newRes.data.results || newRes.data).slice(0, PER_SECTION));
      })
      .catch((err) => notify(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  // Promotions : seulement les produits avec une vraie remise
  const promotions = useMemo(
    () => popularAll.filter((p) => getProductDiscount(p)).slice(0, PER_SECTION),
    [popularAll],
  );

  // Populaires : on évite les produits déjà montrés dans Nouveautés
  const popular = useMemo(() => {
    const newIds = new Set(newArrivals.map((p) => p.id));
    return popularAll.filter((p) => !newIds.has(p.id)).slice(0, PER_SECTION);
  }, [popularAll, newArrivals]);

  const showPromotions = loading || promotions.length > 0;

  return (
    <div>
      <HeroSection categories={categories} />

      <CategorySection categories={categories} />

      <ProductSection
        title="Nouveautés"
        subtitle="Les derniers produits ajoutés"
        products={newArrivals}
        loading={loading}
        viewAllLink="/products?ordering=-created_at"
      />

      <PromoBanner />

      {showPromotions && (
        <ProductSection
          title="Promotions"
          subtitle="Profitez de nos meilleures offres"
          products={promotions}
          loading={loading}
          // À adapter selon ton API (filtre promo)
          viewAllLink="/products?promo=true"
          variant="alt"
        />
      )}

      <ProductSection
        title="Produits populaires"
        subtitle="Les plus appréciés par nos clients"
        products={popular}
        loading={loading}
        viewAllLink="/products?ordering=-popularity"
      />

      <Newsletter />
    </div>
  );
}