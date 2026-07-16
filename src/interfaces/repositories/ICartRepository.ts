import { Cart } from '../../models/Cart';
import { CartItem } from '../../models/CartItem';
import { EntityManager } from 'typeorm';

export interface ICartRepository {
  findByCustomerId(customerId: string): Promise<Cart | null>;
  findOrCreate(customerId: string): Promise<Cart>;
  findItemById(itemId: string): Promise<CartItem | null>;
  upsertItem(cartId: string, productId: string, variantId: string | null, quantity: number, priceAtTime: number): Promise<CartItem>;
  editQuantity(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  markConverted(cartId: string, manager?: EntityManager): Promise<void>;
}
