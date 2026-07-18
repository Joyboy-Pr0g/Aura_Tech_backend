import { RefundRequest, RefundRequestStatus } from '../../models/RefundRequest';

export interface RefundRequestFilters {
  status?: RefundRequestStatus;
  order_number?: string;
  limit?: number;
  cursor?: string;
}

export interface IRefundRequestRepository {
  findById(id: string): Promise<RefundRequest | null>;
  findByOrderId(orderId: string): Promise<RefundRequest | null>;
  create(data: Partial<RefundRequest>): Promise<RefundRequest>;
  update(id: string, data: Partial<RefundRequest>): Promise<RefundRequest>;
  list(filters: RefundRequestFilters): Promise<{ items: RefundRequest[]; next_cursor: string | null; has_more: boolean }>;
}
