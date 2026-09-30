import { UserType } from '../database/entities';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: UserType;
}
