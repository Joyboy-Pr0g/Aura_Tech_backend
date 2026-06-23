import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Cart } from '../../models/Cart';
import { CartItem } from '../../models/CartItem';
import { ICartRepository } from '../../interfaces/repositories/ICartRepository';

@injectable()
export class CartRepository implements ICartRepository {
  private get cartRepo() { return AppDataSource.getRepository(Cart); }
  private get itemRepo() { return AppDataSource.getRepository(CartItem); }

  async findByCustomerId(customerId: string): Promise<Cart | null> {
    return this.cartRepo.findOne({
      where: { customer_id: customerId, status: 'active' },
      relations: ['items', 'items.product', 'items.variant'],
    });
  }

  async findOrCreate(customerId: string): Promise<Cart> {
    const existing = await this.findByCustomerId(customerId);
    if (existing) return existing;

    const cart = this.cartRepo.create({
      customer_id: customerId,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    const saved = await this.cartRepo.save(cart);
    saved.items = [];
    return saved;
  }

  async findItemById(itemId: string): Promise<CartItem | null> {
    return this.itemRepo.findOne({ where: { id: itemId } });
  }

  async upsertItem(
    cartId: string,
    productId: string,
    variantId: string | null,
    quantity: number,
    priceAtTime: number,
  ): Promise<CartItem> {
    const where: any = { cart_id: cartId, product_id: productId };
    if (variantId) where.variant_id = variantId;

    let item = await this.itemRepo.findOne({ where });
    if (item) {
      item.quantity = quantity;
      item.price_at_time = priceAtTime;
      return this.itemRepo.save(item);
    }

    const newItem = this.itemRepo.create({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
      price_at_time: priceAtTime,
    });
    return this.itemRepo.save(newItem);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.itemRepo.delete(itemId);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.itemRepo.delete({ cart_id: cartId });
  }

  async markConverted(cartId: string): Promise<void> {
    await this.cartRepo.update(cartId, { status: 'converted_to_order' });
  }
}
