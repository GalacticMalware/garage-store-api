export interface UserRow {
  id: number;
  uuid: string;
  user_name: string;
  container: string;
  hash: string;
}

/** Contenido del JWT: solo uuid y container. */
export interface JwtPayload {
  uuid: string;
  container: string;
}

export interface AuthenticatedUser {
  id: number;
  uuid: string;
  container: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
}
