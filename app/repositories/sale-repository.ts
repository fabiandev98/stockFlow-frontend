import { Repository } from "./repository";
import type { Sale, SalePayload } from "~/types/sale";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/sales";

export class SaleRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<Sale>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: SalePayload) {
    return this.api<Sale>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  findById(id: number) {
    return this.api<Sale>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }
}
