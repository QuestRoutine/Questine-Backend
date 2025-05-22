import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
        completed: 'asc',
      },
    });
    return data;
  }

  /* 할 일 완료 시 
  - 로그 기록
  - 경험치 지급
  - 업적 체크
  */
  async completeTodo(id: number): Promise<{ exp: number; exp_given: boolean }> {
    const todo = await this.prisma.todos.findUnique({
      where: { todo_id: id },
    });
    if (!todo) throw new BadRequestException('할 일이 없습니다.');

    if (!todo.completed && !todo.exp_given) {
      await this.prisma.$transaction(async (prisma) => {
        // 완료 처리
        const updatedTodo = await prisma.todos.update({
          where: { todo_id: id },
          data: {
            completed: true,
            completed_at: new Date(),
            updated_at: new Date(),
            exp_given: true,
            exp_reward: 100,
          },
        });

        // 사용자 정보 조회
        // 캐릭터 이름을 사용자 닉네임으로 설정
        const user = await prisma.users.findUnique({
          where: { user_id: updatedTodo.user_id },
          select: { nickname: true },
        });

        if (!user) {
          throw new BadRequestException('사용자를 찾을 수 없습니다.');
        }

        // 캐릭터 업데이트
        const characterName = user.nickname;

        await prisma.characters.upsert({
          where: {
            user_id_character_name: {
              user_id: updatedTodo.user_id,
              character_name: characterName,
            },
          },
          update: {
            exp: { increment: updatedTodo.exp_reward },
            updated_at: new Date(),
          },
          create: {
            user_id: updatedTodo.user_id,
            character_name: characterName,
          },
        });

        // 캐릭터 조회 및 경험치 로그 기록
        const character = await prisma.characters.findUnique({
          where: {
            user_id_character_name: {
              user_id: updatedTodo.user_id,
              character_name: characterName,
            },
          },
          select: { character_id: true },
        });

        await prisma.exp_logs.create({
          data: {
            user_id: updatedTodo.user_id,
            todo_id: updatedTodo.todo_id,
            exp: updatedTodo.exp_reward,
            created_at: new Date(),
            character_id: character.character_id,
          },
        });

        // todo 로그 기록
        await prisma.todo_logs.create({
          data: {
            todo_id: todo.todo_id,
            user_id: todo.user_id,
            action: 'COMPLETE',
            created_at: new Date(),
            todo_id_snapshot: todo.todo_id,
          },
        });

        // 업적 체크 등 추가 로직 (예정)
      });

      // 트랜잭션이 완료된 후에 exp_reward 값을 조회하여 반환
      const updatedTodo = await this.prisma.todos.findUnique({
        where: { todo_id: id },
        select: { exp_reward: true, exp_given: true },
      });
      return {
        exp: updatedTodo.exp_reward,
        exp_given: updatedTodo.exp_given,
      };
    } else if (!todo.completed && todo.exp_given) {
      // 미완료된 할일을 체크했지만 해당 할 일에서 경험치를 먹은 이력이 있을 경우
      // 경험치 중복 획득 방지 (최초 1회만 획득)
      // 경험치 지급 여부 업데이트
      await this.prisma.todos.update({
        where: { todo_id: id },
        data: {
          completed: true,
          completed_at: new Date(),
          updated_at: new Date(),
        },
      });
      // exp_reward 값 반환
      const updatedTodo = await this.prisma.todos.findUnique({
        where: { todo_id: id },
        select: { exp_reward: true, exp_given: true },
      });
      return {
        exp: updatedTodo.exp_reward,
        exp_given: updatedTodo.exp_given,
      };
    } else if (todo.completed && todo.exp_given) {
      // 이미 완료된 할 일이고 경험치도 지급된 경우
      return {
        exp: todo.exp_reward,
        exp_given: true,
      };
    } else {
      // 예외 상황 처리 (예상치 못한 상태)
      throw new BadRequestException('처리할 수 없는 할 일 상태입니다.');
    }
  }

  // 할 일 추가
  async addTodo(user: users, addTodoDto: AddTodoDto) {
    const { user_id } = user;
    const { content, due_at } = addTodoDto;
    const data = await this.prisma.todos.create({
      data: {
        user_id,
        content,
        due_at: due_at ? new Date(due_at) : new Date(),
        // created_at: created_at ? new Date(created_at) : new Date(),
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
      throw new ForbiddenException('삭제를 할 수 없습니다.');
    }
    // 로그 기록
    await this.prisma.todo_logs.create({
      data: {
        todo_id: todo.todo_id,
        user_id: todo.user_id,
        action: 'DELETE',
        created_at: new Date(),
        todo_id_snapshot: todo.todo_id,
      },
    });

    await this.prisma.todos.delete({
      where: { todo_id: id },
    });
    return { meesage: '삭제 완료' };
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
