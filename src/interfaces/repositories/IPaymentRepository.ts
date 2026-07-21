import { Payment, PaymentStatus, AutoVerifyStatus } from '../../models/Payment';
import { PaymentMethod } from '../../models/PaymentMethod';
import { DecodedCursor, CursorListResult } from '../../utils/cursorPagination';

export interface PaymentFilters {
  search?: string;
  payment_method_id?: string;
  status?: PaymentStatus;
  min_amount?: number;
  max_amount?: number;
  limit?: number;
  cursor?: DecodedCursor | null;
}

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findMany(filters: PaymentFilters): Promise<CursorListResult<Payment>>;
  create(dto: {
    orderId: string;
    amount: number;
    submittedByCustomerId: string;
    submittedAt: Date;
    paymentMethodId?: string | null;
    status?: PaymentStatus;
    approvedByAdminId?: string | null;
  }): Promise<Payment>;
  attachReceipt(id: string, url: string, publicId: string): Promise<void>;
  updateStatus(id: string, status: PaymentStatus, adminId: string | null, reason: string | null): Promise<void>;
  updateAutoVerifyFields(
    id: string,
    fields: {
      payer_account_number?: string;
      expected_amount_yer?: number;
      auto_verify_status?: AutoVerifyStatus;
    },
  ): Promise<void>;

  findAllMethods(): Promise<PaymentMethod[]>;
  findMethodById(id: string): Promise<PaymentMethod | null>;
  createMethod(dto: {
    name: string;
    account_holder_name: string;
    bank_name: string;
    account_number?: string;
    iban?: string;
    description?: string;
  }): Promise<PaymentMethod>;
  updateMethod(id: string, dto: Partial<PaymentMethod>): Promise<void>;
  softDeleteMethod(id: string): Promise<void>;
  getTotalPayment(): Promise<number>;
}
