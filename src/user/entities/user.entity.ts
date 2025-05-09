export class User {
  userId: number;
  loginType?: string;
  email: string;
  password: string;
  nickname?: string;
  pushToken?: string;
  gold?: number;
  exp?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  level?: number;
}
