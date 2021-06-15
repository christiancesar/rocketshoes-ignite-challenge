import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { setConstantValue } from 'typescript';
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
    console.log("useState")
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const productFind = cart.find(product => product.id === productId);

      const response = await api.get(`/stock/${productId}`);
      const stock = response.data as Stock;

      let updateProduct = [] as Product[];

      if (productFind) {
        const newProductAmount = (productFind.amount + 1);

        if (newProductAmount > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        updateProduct = cart.map(product => {
          if (product.id === productId) {
            product.amount += 1;
          }
          return product;
        })

      }
      else {
        const response = await api.get(`/products/${productId}`);
        const product = response.data as Product;
        product.amount = 1;

        updateProduct = [...cart, product];
      }

      setCart(updateProduct);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateProduct));
    } catch (err) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(product => product.id === productId);
      if (!productExist) {                
        throw new Error('Erro na remoção do produto');
        
      }

      const newProductCart = cart.filter(product => product.id !== productId);

      setCart(newProductCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProductCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (!(amount < 1)) {
        const response = await api.get(`/stock/${productId}`);
        const stock = response.data as Stock;
        if (amount > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        const cartUpdate = cart.map(product => {
          if (product.id === productId) {
            product.amount = amount;
          }
          return product;
        })

        setCart(cartUpdate);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdate));
      }
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
