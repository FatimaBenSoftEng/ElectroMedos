import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_PREFIX = 'electromedos_wishlist';
const WishlistContext = createContext(null);

// Une clé par utilisateur : electromedos_wishlist_12, electromedos_wishlist_13...
// Sans utilisateur connecté, on utilise la clé « guest ».
const storageKey = (userId) => `${STORAGE_PREFIX}_${userId ?? 'guest'}`;

function loadWishlist(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // L'état garde l'identifiant du propriétaire de la liste
  const [state, setState] = useState(() => ({
    userId,
    items: loadWishlist(userId),
  }));

  // Quand l'utilisateur change (connexion, déconnexion, nouveau compte),
  // on charge tout de suite SA liste. Il n'y a jamais de mélange.
  if (state.userId !== userId) {
    setState({ userId, items: loadWishlist(userId) });
  }

  const items = state.userId === userId ? state.items : [];

  // Sauvegarde dans la clé du bon utilisateur
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(state.userId), JSON.stringify(state.items));
    } catch {
      /* stockage plein ou bloqué : on ignore */
    }
  }, [state]);

  const updateItems = useCallback((updater) => {
    setState((prev) => ({ ...prev, items: updater(prev.items) }));
  }, []);

  const toggleWishlist = useCallback(
    (product) => {
      updateItems((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        if (exists) return prev.filter((item) => item.id !== product.id);
        return [...prev, product];
      });
    },
    [updateItems],
  );

  const isInWishlist = useCallback(
    (productId) => items.some((item) => item.id === productId),
    [items],
  );

  const removeFromWishlist = useCallback(
    (productId) => {
      updateItems((prev) => prev.filter((item) => item.id !== productId));
    },
    [updateItems],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
    }),
    [items, toggleWishlist, isInWishlist, removeFromWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}