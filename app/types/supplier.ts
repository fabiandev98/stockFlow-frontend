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

export interface SupplierQualityMetrics {
  delivered_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  acceptance_percentage: number;
  rejected_value: number;
  incidents: number;
  rated_deliveries: number;
  good_ratings: number;
  positive_feedback_percentage: number;
  average_rating: number;
  feedback_incidents: number;
}

export interface SupplierNotePayload {
  rating: "good" | "regular" | "bad";
  issue_type: "quality" | "shortage" | "packaging" | "expiration" | "other" | null;
  note: string | null;
}

export interface SupplierNote extends SupplierNotePayload {
  id: number;
  supplier_id: number;
  user_id: number | null;
  created_at: string;
}
