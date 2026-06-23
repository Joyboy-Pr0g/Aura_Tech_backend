import { container } from 'tsyringe';
import { REPOSITORY_TOKENS } from './repository.tokens';

// Repositories
import { AuthRepository } from '../repositories/auth/AuthRepository';
import { CategoryRepository } from '../repositories/category/CategoryRepository';
import { ProductRepository } from '../repositories/product/ProductRepository';
import { CartRepository } from '../repositories/cart/CartRepository';
import { OrderRepository } from '../repositories/order/OrderRepository';
import { PaymentRepository } from '../repositories/payment/PaymentRepository';
import { AddressRepository } from '../repositories/address/AddressRepository';

// Services
import { AuthService } from '../services/auth/AuthService';
import { CategoryService } from '../services/category/CategoryService';
import { ProductService } from '../services/product/ProductService';
import { CartService } from '../services/cart/CartService';
import { OrderService } from '../services/order/OrderService';
import { PaymentService } from '../services/payment/PaymentService';
import { AddressService } from '../services/address/AddressService';

// Controllers
import { AuthController } from '../controllers/auth/AuthController';
import { CategoryController } from '../controllers/category/CategoryController';
import { ProductController } from '../controllers/product/ProductController';
import { CartController } from '../controllers/cart/CartController';
import { OrderController } from '../controllers/order/OrderController';
import { PaymentController } from '../controllers/payment/PaymentController';
import { AddressController } from '../controllers/address/AddressController';

export function registerDependencies(): void {
  // ─── Repositories ────────────────────────────────────────────────────────
  container.registerSingleton(REPOSITORY_TOKENS.IAuthRepository, AuthRepository);
  container.registerSingleton(REPOSITORY_TOKENS.ICategoryRepository, CategoryRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IProductRepository, ProductRepository);
  container.registerSingleton(REPOSITORY_TOKENS.ICartRepository, CartRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IOrderRepository, OrderRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IPaymentRepository, PaymentRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IAddressRepository, AddressRepository);

  // ─── Services ────────────────────────────────────────────────────────────
  container.registerSingleton(AuthService, AuthService);
  container.registerSingleton(CategoryService, CategoryService);
  container.registerSingleton(ProductService, ProductService);
  container.registerSingleton(CartService, CartService);
  container.registerSingleton(OrderService, OrderService);
  container.registerSingleton(PaymentService, PaymentService);
  container.registerSingleton(AddressService, AddressService);

  // ─── Controllers ─────────────────────────────────────────────────────────
  container.registerSingleton(AuthController, AuthController);
  container.registerSingleton(CategoryController, CategoryController);
  container.registerSingleton(ProductController, ProductController);
  container.registerSingleton(CartController, CartController);
  container.registerSingleton(OrderController, OrderController);
  container.registerSingleton(PaymentController, PaymentController);
  container.registerSingleton(AddressController, AddressController);
}
