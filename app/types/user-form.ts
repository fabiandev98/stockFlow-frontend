export type UserFormMode = "register" | "create" | "edit";

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role_id?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role_id: number;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role_id?: number;
}
