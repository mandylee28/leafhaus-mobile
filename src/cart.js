// Leafhaus — cart state shared between the Menu, Customise and Cart screens.

import React, { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // { drinkId, size, ice, sweet, qty }
  const [store, setStore] = useState(null);

  function addItem(item) {
    setCart((prev) => {
      const i = prev.findIndex(
        (x) =>
          x.drinkId === item.drinkId &&
          x.size === item.size &&
          x.ice === item.ice &&
          x.sweet === item.sweet
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
  }

  function setQty(index, qty) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== index);
      return prev.map((item, i) => (i === index ? { ...item, qty } : item));
    });
  }

  function clearCart() {
    setCart([]);
  }

  const value = useMemo(
    () => ({ cart, addItem, setQty, clearCart, store, setStore }),
    [cart, store]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
