import { Repository } from "./repository";
import type { User } from "~/types/user";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import type { Role } from "~/types/role";
import type {
  CreateUserPayload,
  UpdateUserPasswordPayload,
  UpdateUserPayload,
} from "~/types/user-form";

const BASE_ENDPOINT_URL = "/users";

export class UserRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<User>>(endpoint, {
      method: "GET",
    });
  }

  findById(id: number) {
    return this.api<User>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }

  store(data: CreateUserPayload) {
    return this.api<User>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: data,
    });
  }

  updateById(id: number, data: UpdateUserPayload) {
    return this.api<User>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  updatePasswordById(id: number, data: UpdateUserPasswordPayload) {
    return this.api<{ message: string }>(
      `${BASE_ENDPOINT_URL}/${id}/password`,
      {
        method: "PATCH",
        body: data,
      }
    );
  }

  deleteById(id: number) {
    return this.api<null>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "DELETE",
    });
  }

  getRolesBelow() {
    return this.api<Role[]>(`${BASE_ENDPOINT_URL}/roles-below`, {
      method: "GET",
    });
  }
}
