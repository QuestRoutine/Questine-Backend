import { IsNumber, IsString } from 'class-validator';

export class TodoDto {
  @IsNumber()
  todoId: number;

  @IsString()
  content: string;
}
