import type { Material } from "~/types/material";
import type { Product } from "~/types/product";
import type { Supplier } from "~/types/supplier";
import type { User } from "~/types/user";

export interface PurchaseItemPayload {
  material_id: number | null;
  product_id: number | null;
  quantity: number;
  unit_cost: number;
  expiration_date: string | null;
}

export interface PurchasePayload {
  supplier_id: number | null;
  purchase_date: string;
  notes: string | null;
  items: PurchaseItemPayload[];
}

export interface StockBatch {
  id: number;
  material_id: number;
  material?: Material;
  purchase_item_id: number | null;
  purchase_item?: PurchaseItem;
  initial_quantity: string;
  available_quantity: string;
  unit_cost: string;
  received_date: string;
  expiration_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBatch {
  id: number;
  product_id: number;
  product?: Product;
  purchase_item_id: number | null;
  purchase_item?: PurchaseItem;
  initial_quantity: string;
  available_quantity: string;
  unit_cost: string;
  received_date: string;
  expiration_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  material_id: number | null;
  material?: Material | null;
  product_id: number | null;
  product?: Product | null;
  quantity: string;
  unit_cost: string;
  total_cost: string;
  expiration_date: string | null;
  stock_batches?: StockBatch[];
  product_batches?: ProductBatch[];
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: number;
  supplier_id: number | null;
  supplier?: Supplier | null;
  user_id: number;
  user?: User;
  purchase_date: string;
  total_cost: string;
  notes: string | null;
  items_count?: number;
  items?: PurchaseItem[];
  created_at: string;
  updated_at: string;
}
