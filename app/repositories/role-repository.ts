import { Repository } from "./repository";
import type { Role, NewRole } from "~/types/role";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/roles";

export class RoleRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<Role>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: NewRole) {
    return this.api<Role>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  updateById(id: number, payload: NewRole) {
    return this.api<Role>(`${BASE_ENDPOINT_URL}/${id}`, {
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
    return this.api<Role>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }
}
