import type { Product } from "./product";
import type { User } from "./user";
import type { ProductStockMovement, StockMovement } from "./inventory";

export interface SaleItemPayload {
  product_id: number | null;
  quantity: number;
}

export interface SalePayload {
  sale_date: string;
  covers: number | null;
  discount_amount: number;
  tax_rate: number;
  notes: string | null;
  items: SaleItemPayload[];
}

export interface CancelSalePayload {
  reason: string;
}

export interface SaleReturnPayload {
  return_date: string;
  reason: string;
  items: Array<{ sale_item_id: number; quantity: number; disposition: "restock" | "waste" }>;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: string;
  total_price: string;
  stock_movements?: StockMovement[];
  product_stock_movements?: ProductStockMovement[];
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  user_id: number;
  user?: User;
  sale_date: string;
  covers: number | null;
  subtotal_amount: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  status: "completed" | "cancelled";
  cancelled_at: string | null;
  cancelled_by_user_id: number | null;
  cancelled_by?: User | null;
  cancellation_reason: string | null;
  notes: string | null;
  items_count?: number;
  items?: SaleItem[];
  created_at: string;
  updated_at: string;
}
