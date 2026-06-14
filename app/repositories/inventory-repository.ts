import { Repository } from "./repository";
import type {
  InventoryMaterial,
  InventoryStockBatch,
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

  stockBatches(queryString?: string) {
    const endpoint = queryString
      ? `/stock-batches?${queryString}`
      : "/stock-batches";

    return this.api<LaravelPaginationWrapper<InventoryStockBatch>>(endpoint, {
      method: "GET",
    });
  }
}
