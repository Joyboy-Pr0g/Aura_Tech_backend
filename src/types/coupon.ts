export interface CouponLineItem {
  product_id: string;
  category_id: string;
  sub_category_id?: string | null;
  line_total: number;
}
