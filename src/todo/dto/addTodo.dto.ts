import { IsDate, IsString } from 'class-validator';

export class AddTodoDto {
  @IsString()
  content: string;

  @IsDate()
  created_at: Date;
}
