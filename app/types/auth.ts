import type { User } from "./user";

export interface Token {
  token: string;
  type: string;
  expires_at: string;
  created_at: string;
}

export interface AuthPayload {
  user: User;
  token: Token;
}
