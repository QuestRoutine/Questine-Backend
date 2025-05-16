import { IsString } from 'class-validator';

export class AddTodoDto {
  @IsString()
  content: string;
}
