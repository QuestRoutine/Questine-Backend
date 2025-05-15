import { IsDate, IsNumber, IsString } from 'class-validator';

export class AddTodoDto {
  @IsNumber()
  todoId: number;

  @IsString()
  content: string;

  @IsDate()
  created_at: Date;
}
