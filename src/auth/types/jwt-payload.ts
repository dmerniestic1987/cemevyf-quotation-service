import { Role } from './role.enum';

export interface JwtPayload {
  /** The user ID */
  sub: string;
  /** Informative only: the guards always use the role stored in the database */
  role: Role;
  /** The token version of the user. Tokens with an older version are rejected */
  tv: number;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
}
