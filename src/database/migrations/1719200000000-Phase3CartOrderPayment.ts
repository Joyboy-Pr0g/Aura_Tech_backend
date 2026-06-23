import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3CartOrderPayment1719200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // customer_addresses
    await queryRunner.query(`
      CREATE TABLE customer_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES users(id),
        label VARCHAR NOT NULL,
        full_name VARCHAR NOT NULL,
        phone VARCHAR NOT NULL,
        city VARCHAR NOT NULL,
        governorate VARCHAR NOT NULL,
        district VARCHAR,
        street_address TEXT NOT NULL,
        postal_code VARCHAR,
        type VARCHAR NOT NULL DEFAULT 'both',
        is_default BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id)`);

    // carts
    await queryRunner.query(`
      CREATE TABLE carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL UNIQUE REFERENCES users(id),
        status VARCHAR NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_carts_customer_id ON carts(customer_id)`);
    await queryRunner.query(`CREATE INDEX idx_carts_status ON carts(status)`);

    // cart_items
    await queryRunner.query(`
      CREATE TABLE cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        variant_id UUID REFERENCES product_variants(id),
        quantity INTEGER NOT NULL,
        price_at_time DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id)`);
    await queryRunner.query(`CREATE INDEX idx_cart_items_product_id ON cart_items(product_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_cart_items_cart_product_variant ON cart_items(cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'))`);

    // payment_methods
    await queryRunner.query(`
      CREATE TABLE payment_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        bank_name VARCHAR NOT NULL,
        account_number VARCHAR,
        iban VARCHAR,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // orders
    await queryRunner.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR NOT NULL UNIQUE,
        customer_id UUID NOT NULL REFERENCES users(id),
        shipping_address_id UUID REFERENCES customer_addresses(id),
        billing_address_id UUID REFERENCES customer_addresses(id),
        status VARCHAR NOT NULL DEFAULT 'pending_payment',
        subtotal DECIMAL(10,2) NOT NULL,
        discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
        tax DECIMAL(10,2) NOT NULL DEFAULT 0,
        shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_orders_customer_id ON orders(customer_id)`);
    await queryRunner.query(`CREATE INDEX idx_orders_status ON orders(status)`);
    await queryRunner.query(`CREATE INDEX idx_orders_created_at ON orders(created_at)`);

    // order_items
    await queryRunner.query(`
      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        variant_id UUID REFERENCES product_variants(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending'
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_order_items_order_id ON order_items(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_order_items_product_id ON order_items(product_id)`);

    // order_status_history
    await queryRunner.query(`
      CREATE TABLE order_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        previous_status VARCHAR,
        new_status VARCHAR NOT NULL,
        changed_by_id UUID REFERENCES users(id),
        change_reason VARCHAR,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at)`);

    // payments
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
        amount DECIMAL(10,2) NOT NULL,
        receipt_document_url VARCHAR,
        receipt_public_id VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'pending',
        submitted_by_customer_id UUID NOT NULL REFERENCES users(id),
        submitted_at TIMESTAMP NOT NULL,
        approved_by_admin_id UUID REFERENCES users(id),
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        rejected_at TIMESTAMP,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_payments_order_id ON payments(order_id)`);
    await queryRunner.query(`CREATE INDEX idx_payments_status ON payments(status)`);
    await queryRunner.query(`CREATE INDEX idx_payments_submitted_at ON payments(submitted_at)`);
    await queryRunner.query(`CREATE INDEX idx_payments_approved_at ON payments(approved_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_status_history`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_methods`);
    await queryRunner.query(`DROP TABLE IF EXISTS cart_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS carts`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_addresses`);
  }
}
