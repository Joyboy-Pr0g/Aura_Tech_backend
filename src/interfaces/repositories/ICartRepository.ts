import { Cart } from '../../models/Cart';
import { CartItem } from '../../models/CartItem';

export interface ICartRepository {
  findByCustomerId(customerId: string): Promise<Cart | null>;
  findOrCreate(customerId: string): Promise<Cart>;
  findItemById(itemId: string): Promise<CartItem | null>;
  upsertItem(cartId: string, productId: string, variantId: string | null, quantity: number, priceAtTime: number): Promise<CartItem>;
  removeItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  markConverted(cartId: string): Promise<void>;
}
