import { IsDate } from 'class-validator';

export class CompleteTodoDto {
  @IsDate()
  created_at: Date;
}
