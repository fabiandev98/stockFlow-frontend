import type { Permission } from "~/constants/permissions";

export interface JWTResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
}

export interface JWTSubject {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    hierarchy: number;
    name: string;
    permissions: Permission[];
  };
}

export interface JWT {
  iss: string;
  iat: number;
  exp: number;
  nbf: number;
  jti: string;
  sub: number;
  prv: string;
  user: JWTSubject;
}
