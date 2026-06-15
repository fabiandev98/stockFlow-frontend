import { Repository } from "./repository";
import type {
  ProductCategory,
  ProductCategoryPayload,
} from "~/types/product";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/product-categories";

export class ProductCategoryRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<ProductCategory>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: ProductCategoryPayload) {
    return this.api<ProductCategory>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  updateById(id: number, payload: ProductCategoryPayload) {
    return this.api<ProductCategory>(`${BASE_ENDPOINT_URL}/${id}`, {
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
    return this.api<ProductCategory>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }
}
