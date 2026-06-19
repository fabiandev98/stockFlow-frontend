export interface DashboardPeriod {
  start_date: string;
  end_date: string;
  expiration_window_days: number;
}

export interface DashboardSalesMetrics {
  total: string;
  count: number;
  items_sold: number;
}

export interface DashboardPurchaseMetrics {
  total: string;
  count: number;
}

export interface DashboardInventoryMetrics {
  low_stock_materials: number;
  inventory_value: string;
  expired_batches: number;
  expiring_batches: number;
}

export interface DashboardTopProduct {
  product_id: number;
  product_name: string;
  quantity: string;
  total: string;
}

export interface DashboardSalesByDay {
  date: string;
  total: string;
}

export interface DashboardSummary {
  period: DashboardPeriod;
  sales: DashboardSalesMetrics;
  purchases: DashboardPurchaseMetrics;
  inventory: DashboardInventoryMetrics;
  top_products: DashboardTopProduct[];
  sales_by_day: DashboardSalesByDay[];
}

export interface DashboardSummaryParams {
  start_date?: string;
  end_date?: string;
  expiration_window_days?: number;
}
