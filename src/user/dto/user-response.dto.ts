import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  userId: number;

  @Expose()
  loginType?: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  nickname?: string;

  @Expose()
  pushToken?: string;

  @Expose()
  gold?: number;

  @Expose()
  exp?: number;

  @Expose()
  level?: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
