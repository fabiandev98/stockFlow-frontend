import { Repository } from "./repository";
import type { Product, ProductPayload } from "~/types/product";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/products";

export class ProductRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<Product>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: ProductPayload) {
    return this.api<Product>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  updateById(id: number, payload: ProductPayload) {
    return this.api<Product>(`${BASE_ENDPOINT_URL}/${id}`, {
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
    return this.api<Product>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }
}
