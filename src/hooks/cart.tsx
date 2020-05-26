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

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    }

    loadProducts();
  }, []);

  const updateCart = async (newProducts: Product[]): Promise<void> => {
    setProducts(newProducts);
    AsyncStorage.setItem('@GoMarketplace:cart', JSON.stringify(newProducts));
  };

  const addToCart = useCallback(
    async newProduct => {
      const index = products.findIndex(product => product.id === newProduct.id);

      let newProducts = [...products];

      if (index >= 0) {
        const product = products[index];

        newProducts[index] = { ...product, quantity: product.quantity + 1 };
      } else {
        newProducts = [...products, { ...newProduct, quantity: 1 }];
      }

      await updateCart(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const index = products.findIndex(product => product.id === id);
      const product = products[index];
      const newProducts = [...products];

      newProducts[index] = { ...product, quantity: product.quantity + 1 };

      await updateCart(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(product => product.id === id);
      const product = products[index];

      const newProducts = [...products];

      if (product.quantity > 1) {
        newProducts[index] = { ...product, quantity: product.quantity - 1 };
      } else {
        newProducts.slice(index, 1);
      }

      await updateCart(newProducts);
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
