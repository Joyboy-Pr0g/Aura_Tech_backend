import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Cart } from '../../models/Cart';
import { CartItem } from '../../models/CartItem';
import { ICartRepository } from '../../interfaces/repositories/ICartRepository';
import { EntityManager } from 'typeorm';

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
    const active = await this.findByCustomerId(customerId);
    if (active) return active;

    const existing = await this.cartRepo.findOne({
      where: { customer_id: customerId },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (existing) {
      await this.clearCart(existing.id);
      await this.cartRepo.update(existing.id, {
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
      });
      existing.status = 'active';
      existing.items = [];
      return existing;
    }

    const cart = this.cartRepo.create({
      customer_id: customerId,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

  async editQuantity(itemId: string, quantity: number): Promise<void> {
    await this.itemRepo.update(itemId, { quantity });
  }

  async removeItem(itemId: string): Promise<void> {
    await this.itemRepo.delete(itemId);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.itemRepo.delete({ cart_id: cartId });
  }

  async markConverted(cartId: string, manager?: EntityManager): Promise<void> {
    const cartRepo = manager?.getRepository(Cart) ?? this.cartRepo;
    await cartRepo.update(cartId, { status: 'converted_to_order' });
  }
}
