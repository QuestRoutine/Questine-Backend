import { IsNumber } from 'class-validator';

export class findUserDto {
  @IsNumber()
  userId: number;
}
