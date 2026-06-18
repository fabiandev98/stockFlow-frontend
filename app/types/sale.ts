import type { Product } from "./product";
import type { ProductBatch } from "./purchase";
import type { User } from "./user";
import type { StockMovement } from "./inventory";

export interface SaleItemPayload {
  product_id: number | null;
  quantity: number;
}

export interface SalePayload {
  sale_date: string;
  notes: string | null;
  items: SaleItemPayload[];
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

export interface ProductStockMovement {
  id: number;
  product_id: number;
  product?: Product;
  product_batch_id: number;
  product_batch?: ProductBatch;
  sale_item_id: number | null;
  user_id: number | null;
  user?: User | null;
  type: "sale";
  quantity: string;
  reason: string | null;
  movement_date: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  user_id: number;
  user?: User;
  sale_date: string;
  total_amount: string;
  notes: string | null;
  items_count?: number;
  items?: SaleItem[];
  created_at: string;
  updated_at: string;
}
