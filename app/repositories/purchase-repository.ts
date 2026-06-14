import { Repository } from "./repository";
import type { Purchase, PurchasePayload } from "~/types/purchase";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/purchases";

export class PurchaseRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<Purchase>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: PurchasePayload) {
    return this.api<Purchase>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  updateById(id: number, payload: PurchasePayload) {
    return this.api<Purchase>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "PATCH",
      body: payload,
    });
  }

  deleteById(id: number) {
    return this.api<null>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "DELETE",
    });
  }

  findById(id: number) {
    return this.api<Purchase>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }
}
