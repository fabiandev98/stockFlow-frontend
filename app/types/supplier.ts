export interface SupplierPayload {
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
}

export interface Supplier extends SupplierPayload {
  id: number;
  purchases_count?: number;
  created_at: string;
  updated_at: string;
}
