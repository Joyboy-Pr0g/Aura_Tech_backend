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
import { ShippingFeeRepository } from '../repositories/shipping/ShippingFeeRepository';

// Services
import { AuthService } from '../services/auth/AuthService';
import { CategoryService } from '../services/category/CategoryService';
import { ProductService } from '../services/product/ProductService';
import { CartService } from '../services/cart/CartService';
import { OrderService } from '../services/order/OrderService';
import { PaymentService } from '../services/payment/PaymentService';
import { AddressService } from '../services/address/AddressService';
import { ShippingFeeService } from '../services/shipping/ShippingFeeService';
import { EngagementService } from '../services/engagement/EngagementService';
import { AdminDashboardService } from '../services/admin/AdminDashboardService';
import { AdminCategoryService } from '../services/admin/AdminCategoryService';
import { AdminProductService } from '../services/admin/AdminProductService';

// Controllers
import { AuthController } from '../controllers/auth/AuthController';
import { AdminDashboardController } from '../controllers/admin/Admin.DashboardController';
import { AdminUserController } from '../controllers/admin/Admin.UserController';
import { AdminProductController } from '../controllers/admin/Admin.ProductController';
import { AdminOrderController } from '../controllers/admin/Admin.OrderController';
import { AdminCategoryController } from '../controllers/admin/Admin.CategoryController';
import { AdminPaymentController } from '../controllers/admin/Admin.PaymentController';
import { CategoryController } from '../controllers/category/CategoryController';
import { ProductController } from '../controllers/product/ProductController';
import { CartController } from '../controllers/cart/CartController';
import { OrderController } from '../controllers/order/OrderController';
import { PaymentController } from '../controllers/payment/PaymentController';
import { AddressController } from '../controllers/address/AddressController';
import { EngagementController } from '../controllers/engagement/EngagementController';
import { ShippingFeeController } from '../controllers/shipping/ShippingFeeController';
import { AdminShippingFeeController } from '../controllers/admin/Admin.ShippingFeeController';

export function registerDependencies(): void {
  // ─── Repositories ────────────────────────────────────────────────────────
  container.registerSingleton(REPOSITORY_TOKENS.IAuthRepository, AuthRepository);
  container.registerSingleton(REPOSITORY_TOKENS.ICategoryRepository, CategoryRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IProductRepository, ProductRepository);
  container.registerSingleton(REPOSITORY_TOKENS.ICartRepository, CartRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IOrderRepository, OrderRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IPaymentRepository, PaymentRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IAddressRepository, AddressRepository);
  container.registerSingleton(REPOSITORY_TOKENS.IShippingFeeRepository, ShippingFeeRepository);

  // ─── Services ────────────────────────────────────────────────────────────
  container.registerSingleton(AuthService, AuthService);
  container.registerSingleton(CategoryService, CategoryService);
  container.registerSingleton(ProductService, ProductService);
  container.registerSingleton(CartService, CartService);
  container.registerSingleton(OrderService, OrderService);
  container.registerSingleton(PaymentService, PaymentService);
  container.registerSingleton(AddressService, AddressService);
  container.registerSingleton(ShippingFeeService, ShippingFeeService);
  container.registerSingleton(EngagementService, EngagementService);
  container.registerSingleton(AdminDashboardService, AdminDashboardService);
  container.registerSingleton(AdminCategoryService, AdminCategoryService);
  container.registerSingleton(AdminProductService, AdminProductService);

  // ─── Controllers ─────────────────────────────────────────────────────────
  container.registerSingleton(AuthController, AuthController);
  container.registerSingleton(CategoryController, CategoryController);
  container.registerSingleton(ProductController, ProductController);
  container.registerSingleton(CartController, CartController);
  container.registerSingleton(OrderController, OrderController);
  container.registerSingleton(PaymentController, PaymentController);
  container.registerSingleton(AddressController, AddressController);
  container.registerSingleton(EngagementController, EngagementController);
  container.registerSingleton(ShippingFeeController, ShippingFeeController);
  container.registerSingleton(AdminShippingFeeController, AdminShippingFeeController);
  container.registerSingleton(AdminDashboardController, AdminDashboardController);
  container.registerSingleton(AdminUserController, AdminUserController);
  container.registerSingleton(AdminProductController, AdminProductController);
  container.registerSingleton(AdminOrderController, AdminOrderController);
  container.registerSingleton(AdminCategoryController, AdminCategoryController);
  container.registerSingleton(AdminPaymentController, AdminPaymentController);
}
