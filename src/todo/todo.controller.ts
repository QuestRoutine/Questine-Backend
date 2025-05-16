import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/user.decorator';
import { users } from 'generated/prisma';
import { AddTodoDto } from './dto/addTodo.dto';
import { EditTodoDto } from './dto/editTodo.dto';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get('/')
  @UseGuards(AuthGuard())
  getTodos(@User() user: users) {
    return this.todoService.getTodos(user);
  }

  @Post('/')
  @UseGuards(AuthGuard())
  addTodo(@User() user: users, @Body() addTodoDto: AddTodoDto) {
    return this.todoService.addTodo(user, addTodoDto);
  }

  @Post('/done/:todoId')
  @UseGuards(AuthGuard())
  completeTodo(@Param('todoId') id: string) {
    return this.todoService.completeTodo(Number(id));
  }

  @Delete('/:todoId')
  @UseGuards(AuthGuard())
  deleteTodo(@Param('todoId') id: string, @User() user: users) {
    return this.todoService.deleteTodo(Number(id), user);
  }

  @Put('/:todoId')
  @UseGuards(AuthGuard())
  editTodo(
    @Param('todoId') id: string,
    @User() user: users,
    @Body() todoDto: EditTodoDto,
  ) {
    return this.todoService.editTodo(Number(id), user, todoDto);
  }
}
