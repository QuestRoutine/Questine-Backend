import { IsBoolean, IsDate, IsString } from 'class-validator';

export class EditTodoDto {
  @IsString()
  content: string;

  @IsBoolean()
  completed: boolean;

  @IsDate()
  updated_at?: Date;

  @IsDate()
  completed_at?: Date;
}
