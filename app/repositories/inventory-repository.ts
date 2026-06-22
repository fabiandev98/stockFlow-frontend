import { Repository } from "./repository";
import type {
  InventoryAlerts,
  InventoryMaterial,
  InventoryStockBatch,
  StockMovement,
  StockMovementPayload,
} from "~/types/inventory";
import type { LaravelPaginationWrapper } from "~/types/pagination";

export class InventoryRepository extends Repository {
  materialSummary(queryString?: string) {
    const endpoint = queryString
      ? `/inventory/materials?${queryString}`
      : "/inventory/materials";

    return this.api<LaravelPaginationWrapper<InventoryMaterial>>(endpoint, {
      method: "GET",
    });
  }

  alerts(expirationWindowDays = 7) {
    return this.api<InventoryAlerts>(
      `/inventory/alerts?expiration_window_days=${expirationWindowDays}`,
      {
        method: "GET",
      }
    );
  }

  stockBatches(queryString?: string) {
    const endpoint = queryString
      ? `/stock-batches?${queryString}`
      : "/stock-batches";

    return this.api<LaravelPaginationWrapper<InventoryStockBatch>>(endpoint, {
      method: "GET",
    });
  }

  stockMovements(queryString?: string) {
    const endpoint = queryString
      ? `/stock-movements?${queryString}`
      : "/stock-movements";

    return this.api<LaravelPaginationWrapper<StockMovement>>(endpoint, {
      method: "GET",
    });
  }

  storeStockMovement(payload: StockMovementPayload) {
    return this.api<StockMovement>("/stock-movements", {
      method: "POST",
      body: payload,
    });
  }
}
