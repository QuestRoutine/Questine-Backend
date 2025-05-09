import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
  Min,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  loginType?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  pushToken?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  gold?: number = 0;

  @IsInt()
  @Min(0)
  @IsOptional()
  exp?: number = 0;

  @IsInt()
  @Min(1)
  @IsOptional()
  level?: number = 1;
}
