// ~/composables/useUserModule.ts
import { useQueryBuilder } from "#imports";
import { UserRepository } from "~/repositories/user-repository";
import type { User } from "~/types/user";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import type { Role } from "~/types/role";
import type {
  CreateUserPayload,
  UpdateUserPasswordPayload,
  UpdateUserPayload,
} from "~/types/user-form";

export function useUserModule() {
  const userRepo = new UserRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchUsers(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<User>> {
    const queryString = buildQueryString(params);
    return await userRepo.index(queryString);
  }

  async function fetchUser(id: number): Promise<User> {
    return await userRepo.findById(id);
  }

  async function createUser(data: CreateUserPayload): Promise<User> {
    return await userRepo.store(data);
  }

  async function updateUser(
    id: number,
    data: UpdateUserPayload
  ): Promise<User> {
    return await userRepo.updateById(id, data);
  }

  async function updateUserPassword(
    id: number,
    data: UpdateUserPasswordPayload
  ): Promise<{ message: string }> {
    return await userRepo.updatePasswordById(id, data);
  }

  async function deleteUser(id: number): Promise<null> {
    return await userRepo.deleteById(id);
  }

  async function fetchCurrentUserRolesBelow(): Promise<Role[]> {
    return await userRepo.getRolesBelow();
  }

  return {
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    fetchCurrentUserRolesBelow,
  };
}
