export const PERMISSION = {
  USERS_CREATE: "users-create",
  USERS_READ: "users-read",
  USERS_UPDATE: "users-update",
  USERS_DELETE: "users-delete",

  ROLES_CREATE: "roles-create",
  ROLES_READ: "roles-read",
  ROLES_UPDATE: "roles-update",
  ROLES_DELETE: "roles-delete",

  MATERIAL_CATEGORIES_CREATE: "material-categories-create",
  MATERIAL_CATEGORIES_READ: "material-categories-read",
  MATERIAL_CATEGORIES_UPDATE: "material-categories-update",
  MATERIAL_CATEGORIES_DELETE: "material-categories-delete",

  MATERIALS_CREATE: "materials-create",
  MATERIALS_READ: "materials-read",
  MATERIALS_UPDATE: "materials-update",
  MATERIALS_DELETE: "materials-delete",

  SUPPLIERS_CREATE: "suppliers-create",
  SUPPLIERS_READ: "suppliers-read",
  SUPPLIERS_UPDATE: "suppliers-update",
  SUPPLIERS_DELETE: "suppliers-delete",

  PURCHASES_CREATE: "purchases-create",
  PURCHASES_READ: "purchases-read",
  PURCHASES_UPDATE: "purchases-update",
  PURCHASES_DELETE: "purchases-delete",

  STOCK_BATCHES_READ: "stock-batches-read",

  INVENTORY_READ: "inventory-read",

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
