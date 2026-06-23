export enum Role {
  ADMIN = 'admin',
  SUB_ADMIN = 'sub_admin',
  CUSTOMER = 'customer',
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

export const ROLE_PERMISSIONS = {
  admin: [
    'create_product', 'edit_product', 'delete_product',
    'view_orders', 'approve_payments', 'refund_order',
    'block_user', 'view_analytics', 'view_users',
    'create_coupon', 'manage_categories', 'manage_inventory',
  ],
  sub_admin: [
    'view_orders', 'approve_payments', 'view_analytics',
  ],
  customer: [
    'view_products', 'create_order', 'track_order', 'create_review',
  ],
} as const;
