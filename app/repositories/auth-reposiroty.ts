import { AUTH_ENDPOINT } from "~/constants/auth-endpoints";
import { Repository } from "./repository";
import type { CreateUserPayload } from "~/types/user-form";
import type { User } from "~/types/user";
import type { AuthPayload, Token } from "~/types/auth";

interface DefaultLoginCredentials {
  email: string;
  password: string;
}

export class AuthRepository extends Repository {
  login(payload: DefaultLoginCredentials) {
    return this.api<AuthPayload>(AUTH_ENDPOINT.LOGIN, {
      method: "POST",
      body: payload,
      requiresAuth: false,
    });
  }

  register(payload: CreateUserPayload) {
    return this.api<User>("/signup", {
      method: "POST",
      body: payload,
      requiresAuth: false,
    });
  }

  forgotPassword(email: string) {
    return this.api("/auth/forgot-password", {
      method: "POST",
      body: { email },
      requiresAuth: false,
    });
  }

  resetPassword(payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) {
    return this.api("/auth/reset-password", {
      method: "POST",
      body: payload,
      requiresAuth: false,
    });
  }

  refreshToken() {
    return this.api<Token>(AUTH_ENDPOINT.REFRESH, {
      method: "POST",
    });
  }

  getCurrentUser() {
    return this.api<User>(AUTH_ENDPOINT.LOGGED_USER_INFO);
  }

  logout() {
    return this.api(AUTH_ENDPOINT.LOGOUT, { method: "POST" });
  }
}
