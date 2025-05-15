import { BadRequestException, Injectable } from '@nestjs/common';
import { users } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { TodoDto } from './dto/todo.dto';
import { AddTodoDto } from './dto/addTodo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  // 할 일 목록
  async getTodos(user: users) {
    const { user_id } = user;
    const data = await this.prisma.todos.findMany({
      where: {
        user_id,
      },
      orderBy: {
        todo_id: 'desc',
      },
    });
    return data;
  }

  // 할 일 추가
  async addTodo(user: users, addTodoDto: AddTodoDto) {
    const { user_id } = user;
    const { content, created_at } = addTodoDto;
    const data = await this.prisma.todos.create({
      data: {
        user_id,
        content,
        created_at,
      },
    });

    return data;
  }

  // 할 일 삭제
  async deleteTodo(id: number) {
    const data = await this.prisma.todos.deleteMany({
      where: {
        todo_id: id,
      },
    });
    return data;
  }

  // 할 일 수정
  async editTodo(id: number, user: users, todoDto: TodoDto) {
    const { user_id } = user;
    const { content } = todoDto;

    const todo = await this.prisma.todos.findUnique({
      where: { todo_id: id },
    });
    if (!todo || todo.user_id !== user_id) {
      throw new Error('수정 권한이 없습니다.');
    }
    try {
      const data = await this.prisma.todos.update({
        where: { todo_id: id },
        data: { content },
      });
      return data;
    } catch (error) {
      throw new BadRequestException(
        '할 일 수정에 실패했습니다.',
        error.message,
      );
    }
  }
}
