import { Repository } from "./repository";
import type {
  MaterialCategory,
  MaterialCategoryPayload,
} from "~/types/material";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/material-categories";

export class MaterialCategoryRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<MaterialCategory>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: MaterialCategoryPayload) {
    return this.api<MaterialCategory>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  updateById(id: number, payload: MaterialCategoryPayload) {
    return this.api<MaterialCategory>(`${BASE_ENDPOINT_URL}/${id}`, {
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
    return this.api<MaterialCategory>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }
}
