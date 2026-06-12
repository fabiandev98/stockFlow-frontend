export const PERMISSION = {
  USERS_CREATE: "users-create",
  USERS_READ: "users-read",
  USERS_UPDATE: "users-update",
  USERS_DELETE: "users-delete",

  ROLES_CREATE: "roles-create",
  ROLES_READ: "roles-read",
  ROLES_UPDATE: "roles-update",
  ROLES_DELETE: "roles-delete",

  MANAGE_API_KEYS_CREATE: "manage-api-keys-create",
  MANAGE_API_KEYS_READ: "manage-api-keys-read",
  MANAGE_API_KEYS_UPDATE: "manage-api-keys-update",
  MANAGE_API_KEYS_DELETE: "manage-api-keys-delete",

  API_KEYS_CREATE: "api-keys-create",
  API_KEYS_READ: "api-keys-read",
  API_KEYS_UPDATE: "api-keys-update",
  API_KEYS_DELETE: "api-keys-delete",
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];
