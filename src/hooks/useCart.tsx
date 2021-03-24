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
      const updatedProduct = cart.find((product) => product.id === productId);

      const productAmountAvailable = productStock.data.amount;

      let newAmount = updatedProduct?.amount ? updatedProduct?.amount + 1 : 0;

      if (newAmount > productAmountAvailable) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productStock.data.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
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
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productCart = cart.find((product) => product.id === productId);

      if (productCart) {
        const newCart = cart.filter((product) => product.id !== productId);

        setCart([...newCart]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const productStock = await api.get<Stock>(`/stock/${productId}`);

      const productAmountAvailable = productStock.data.amount;
      
      if (amount > productAmountAvailable) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productExists = cart.some((cartItem) => cartItem.id === productId);
      if (!productExists) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const newCart = cart.map((cartProduct) =>
        cartProduct.id === productId
          ? { ...cartProduct, amount: amount }
          : cartProduct
      );

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
