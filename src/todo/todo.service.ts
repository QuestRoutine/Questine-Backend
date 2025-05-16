import { BadRequestException, Injectable } from '@nestjs/common';
import { users } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { AddTodoDto } from './dto/addTodo.dto';
import { EditTodoDto } from './dto/editTodo.dto';

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

  /* 할 일 완료 시 
  - 로그 기록
  - 경험치 지급
  - 업적 체크
  
  */
  async completeTodo(id: number): Promise<void> {
    const todo = await this.prisma.todos.findUnique({
      where: { todo_id: id },
    });
    if (!todo) throw new Error('할 일이 없습니다.');
    if (!todo.completed && !todo.exp_given) {
      await this.prisma.$transaction(async (prisma) => {
        // 완료 처리
        await prisma.todos.update({
          where: { todo_id: id },
          data: {
            completed: true,
            completed_at: new Date(),
            updated_at: new Date(),
            exp_given: true,
          },
        });

        // 경험치 지급
        await prisma.users.update({
          where: { user_id: todo.user_id },
          data: { exp: { increment: 1000 } },
        });

        // 경험치 로그 기록
        await prisma.exp_logs.create({
          data: {
            user_id: todo.user_id,
            todo_id: todo.todo_id,
            exp: 1000,
            created_at: new Date(),
          },
        });

        // 로그 기록
        await prisma.todo_logs.create({
          data: {
            todo_id: todo.todo_id,
            user_id: todo.user_id,
            action: 'COMPLETE',
            created_at: new Date(),
          },
        });
        // 업적 체크 등 추가 로직 (예정)
      });
    } else if (!todo.completed && todo.exp_given) {
      // 미완료된 할일을 체크했지만 해당 할 일에서 경험치를 먹은 이력이 있을 경우
      // 경험치 중복 획득 방지 (최초 1회만 획득)
      await this.prisma.todos.update({
        where: { todo_id: id },
        data: {
          completed: true,
          completed_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
  }

  // 할 일 추가
  async addTodo(user: users, addTodoDto: AddTodoDto) {
    const { user_id } = user;
    const { content } = addTodoDto;
    const data = await this.prisma.todos.create({
      data: {
        user_id,
        content,
        created_at: new Date(),
      },
    });

    return data;
  }

  // 할 일 삭제
  async deleteTodo(id: number, user: users) {
    const todo = await this.prisma.todos.findUnique({
      where: { todo_id: id },
    });
    if (!todo || todo.user_id !== user.user_id) {
      throw new Error('삭제 권한이 없습니다.');
    }
    const data = await this.prisma.todos.delete({
      where: { todo_id: id },
    });
    return data;
  }

  // 할 일 수정
  async editTodo(id: number, user: users, todoDto: EditTodoDto) {
    const { user_id } = user;
    const { content, completed } = todoDto;

    const todo = await this.prisma.todos.findUnique({
      where: { todo_id: id },
    });
    if (!todo || todo.user_id !== user_id) {
      throw new Error('수정 권한이 없습니다.');
    }
    try {
      const data = await this.prisma.todos.update({
        where: { todo_id: id },
        data: {
          content,
          updated_at: new Date(),
          completed,
          completed_at: completed ? new Date() : null,
        },
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
