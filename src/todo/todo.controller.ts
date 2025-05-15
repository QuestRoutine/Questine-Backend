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
import { TodoDto } from './dto/todo.dto';
import { AddTodoDto } from './dto/addTodo.dto';

@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get('/')
  @UseGuards(AuthGuard())
  getTodos(@User() user: users) {
    return this.todoService.getTodos(user);
  }

  @Post('/add')
  @UseGuards(AuthGuard())
  addTodo(@User() user: users, @Body() addTodoDto: AddTodoDto) {
    return this.todoService.addTodo(user, addTodoDto);
  }

  @Delete('/delete/:todoId')
  @UseGuards(AuthGuard())
  deleteTodo(@Param('todoId') id: string) {
    return this.todoService.deleteTodo(Number(id));
  }

  @Put('/edit/:todoId')
  @UseGuards(AuthGuard())
  editTodo(
    @Param('todoId') id: string,
    @User() user: users,
    @Body() todoDto: TodoDto,
  ) {
    return this.todoService.editTodo(Number(id), user, todoDto);
  }
}
