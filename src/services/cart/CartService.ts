import { injectable, inject } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { ICartRepository } from '../../interfaces/repositories/ICartRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppError } from '../../core/errors/AppError';

@injectable()
export class CartService {
  constructor(
    @inject(REPOSITORY_TOKENS.ICartRepository) private cartRepo: ICartRepository,
  ) {}

  async getCart(customerId: string) {
    return this.cartRepo.findOrCreate(customerId);
  }

  async addOrUpdateItem(
    customerId: string,
    productId: string,
    variantId: string | null,
    quantity: number,
  ) {
    if (quantity < 1) throw new AppError(400, 'Quantity must be at least 1');

    const cart = await this.cartRepo.findOrCreate(customerId);

    // Validate product availability
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({ where: { id: productId }, relations: ['variants'] });
    if (!product) throw new AppError(404, 'Product not found');

    let price: number;
    if (variantId) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (!variant) throw new AppError(404, 'Variant not found');
      const available = variant.stock_quantity - variant.reserved_quantity;
      if (available < quantity) throw new AppError(400, `Only ${available} units available`);
      price = Number(variant.price ?? product.price);
    } else {
      const available = product.stock_quantity - product.reserved_quantity;
      if (available < quantity) throw new AppError(400, `Only ${available} units available`);
      price = Number(product.price);
    }

    return this.cartRepo.upsertItem(cart.id, productId, variantId, quantity, price);
  }

  async removeItem(customerId: string, itemId: string): Promise<void> {
    const cart = await this.cartRepo.findByCustomerId(customerId);
    if (!cart) throw new AppError(404, 'Cart not found');

    const item = await this.cartRepo.findItemById(itemId);
    if (!item || item.cart_id !== cart.id) throw new AppError(404, 'Item not found in your cart');

    await this.cartRepo.removeItem(itemId);
  }

  async clearCart(customerId: string): Promise<void> {
    const cart = await this.cartRepo.findByCustomerId(customerId);
    if (cart) await this.cartRepo.clearCart(cart.id);
  }
}
