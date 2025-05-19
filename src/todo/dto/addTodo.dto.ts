import { IsDate, IsString } from 'class-validator';

export class AddTodoDto {
  @IsString()
  content: string;

  @IsDate()
  due_at: Date;
}
