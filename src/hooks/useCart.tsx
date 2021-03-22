import { createContext, ReactNode, useContext, useState } from 'react';
import { MdSettingsRemote } from 'react-icons/md';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      //first, check if this product is already in cart
      const cartHasProduct = cart.find((prod) => prod.id === productId)

      //secondly, must check the amount of this product
      const productStock = await api.get<Stock>(`/stock/${productId}`);
      
      console.log(productStock.data);

      if (productStock.data.amount <= 0) {
        toast.error('Estoque esgotado para este produto 🙁!');
      };

      if (!cartHasProduct) {
        const { data: product } = await api.get<Product>(`/products/${productId}`);

        setCart([...cart, {
          ...product, amount: 1
        }]);

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...cart, {
            ...product, amount: 1
          }])
        );

        toast.success('Produto adicionado com sucesso no seu carrinho! 🎉');
      } else {
        const newCart = cart.map((cartProduct) =>
          cartProduct.id === productId
            ? { ...cartProduct, amount: cartProduct.amount + 1 }
            : cartProduct
        );

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart',
          JSON.stringify(newCart)
        );

        toast.success('Produto atualizado com sucesso no seu carrinho! 🎉');
      }

    } catch {
      toast.error('Erro ao adicionar este producto ao carrinho 😕!');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
