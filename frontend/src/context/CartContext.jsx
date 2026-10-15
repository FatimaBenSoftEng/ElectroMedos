import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { orderService } from '../services/orderService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await orderService.getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await orderService.addToCart(productId, quantity);
    setCart(data);
    return data;
  };

  const updateItem = async (itemId, quantity) => {
    const { data } = await orderService.updateCartItem(itemId, quantity);
    setCart(data);
    return data;
  };

  const removeItem = async (itemId) => {
    const { data } = await orderService.removeCartItem(itemId);
    setCart(data);
    return data;
  };

  const clearCart = async () => {
    await orderService.clearCart();
    setCart({ items: [], total: '0.00', item_count: 0 });
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount: cart?.item_count || 0,
      refreshCart,
      addToCart,
      updateItem,
      removeItem,
      clearCart,
    }),
    [cart, loading, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
