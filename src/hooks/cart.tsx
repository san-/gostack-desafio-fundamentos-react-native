import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const STORAGE_KEY = '@GoMarketpace:cart';

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const persistedProducts = await AsyncStorage.getItem(STORAGE_KEY);
      if (persistedProducts) {
        setProducts([...JSON.parse(persistedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      // ADD A NEW ITEM TO THE CART
      let $products;
      const productExists = products.find(p => p.id === product.id);
      if (productExists) {
        $products = products.map(p =>
          p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
        );
        setProducts($products);
      } else {
        $products = [...products, { ...product, quantity: 1 }];
        setProducts($products);
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify($products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      // INCREMENTS A PRODUCT QUANTITY IN THE CART
      const $products = products.map(p =>
        p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
      );
      setProducts($products);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify($products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      // DECREMENTS A PRODUCT QUANTITY IN THE CART
      const $products = products
        .map(p => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
        .filter(p => p.quantity > 0);
      setProducts($products);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify($products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
