import { RoleRepository } from "~/repositories/role-repository";
import type { Role, NewRole } from "~/types/role";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function useRoleModule() {
  const roleRepo = new RoleRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchRoles(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<Role>> {
    const queryString = buildQueryString(params);
    return await roleRepo.index(queryString);
  }

  async function createRole(payload: NewRole): Promise<Role> {
    return await roleRepo.store(payload);
  }

  async function updateRole(id: number, payload: NewRole): Promise<Role> {
    return await roleRepo.updateById(id, payload);
  }

  async function deleteRole(id: number): Promise<null> {
    return await roleRepo.deleteById(id);
  }

  async function fetchRoleById(id: number): Promise<Role> {
    return await roleRepo.findById(id);
  }

  return {
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchRoleById,
  };
}
