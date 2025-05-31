import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { users } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { AddTodoDto } from './dto/add-todo.dto';
import { EditTodoDto } from './dto/edit-todo.dto';
import { CalculateStreak } from './calculate-streak';

@Injectable()
export class TodoService {
  private calculateStreak: CalculateStreak;

  constructor(private readonly prisma: PrismaService) {
    this.calculateStreak = new CalculateStreak(this.prisma);
  }

  // 할 일 목록 (월별 전체 조회)
  async getTodos(user: users, year: number, month: number) {
    const { user_id } = user;
    // 월의 시작과 끝 날짜 계산
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    console.log(startDate, endDate);
    const data = await this.prisma.todos.findMany({
      where: {
        user_id,
        due_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        todo_id: true,
        content: true,
        completed: true,
        created_at: true,
        due_at: true,
        exp_reward: true,
      },
    });
    return data;
  }

  /* 할 일 완료 시
  - 로그 기록
  - 경험치 지급
  - 업적 체크
  */
  async completeTodo(
    id: number,
  ): Promise<{ exp: number; exp_given: boolean; leveledUp?: boolean }> {
    const todo = await this.prisma.todos.findUnique({
      where: { todo_id: id },
    });
    if (!todo) throw new BadRequestException('할 일이 없습니다.');

    // 부정행위 검증: 15초 이내 10개 이상 완료 시
    const now = new Date();
    const fifteenSecondsAgo = new Date(now.getTime() - 15000);
    const recentCompletedCount = await this.prisma.todos.count({
      where: {
        user_id: todo.user_id,
        completed: true,
        completed_at: { gte: fifteenSecondsAgo },
      },
    });
    if (recentCompletedCount >= 2) {
      throw new BadRequestException({
        message: '너무 빨라요! 잠시 후 다시 시도해주세요.',
        cheatingDetected: true,
      });
    }

    let leveledUp = false;

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
        // streak 계산
        const longestStreak = await this.calculateStreak.calculateStreak(
          updatedTodo.user_id,
        );

        // streak 업데이트
        await prisma.profile.update({
          where: { user_id: updatedTodo.user_id },
          data: {
            longest_streak: longestStreak.longestStreak,
            current_streak: longestStreak.currentStreak,
            updated_at: new Date(),
          },
        });

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
            exp: updatedTodo.exp_reward,
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

        // 캐릭터 경험치 레벨업 검증 및 처리
        const characterWithExp = await prisma.characters.findUnique({
          where: {
            user_id_character_name: {
              user_id: updatedTodo.user_id,
              character_name: characterName,
            },
          },
          select: { character_id: true, exp: true, level: true },
        });

        let { exp, level } = characterWithExp;

        while (true) {
          // 현재 레벨의 요구 경험치 조회
          const levelRequirement = await prisma.level_requirements.findUnique({
            where: { level },
          });
          if (!levelRequirement) break;

          if (exp >= levelRequirement.required_exp) {
            // 레벨업 처리
            exp -= levelRequirement.required_exp;
            level += 1;
            leveledUp = true;
            // 캐릭터 레벨/경험치 업데이트
            await prisma.characters.update({
              where: { character_id: characterWithExp.character_id },
              data: { level, exp, updated_at: new Date() },
            });

            // 레벨업 로그 기록
            await prisma.level_up_logs.create({
              data: {
                character_id: characterWithExp.character_id,
                previous_level: level - 1,
                new_level: level,
                leveled_up_at: new Date(),
              },
            });
          } else {
            break;
          }
        }

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
        leveledUp,
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
        leveledUp: false,
      };
    } else if (todo.completed && todo.exp_given) {
      // 이미 완료된 할 일이고 경험치도 지급된 경우
      return {
        exp: todo.exp_reward,
        exp_given: true,
        leveledUp: false,
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
    if (!todo) {
      return { message: '이미 삭제된 할 일입니다.', leveledDown: false };
    }
    if (todo.user_id !== user.user_id) {
      throw new ForbiddenException('삭제를 할 수 없습니다.');
    }

    let leveledDown = false;

    // 경험치 회수 로직 추가
    if (todo.exp_given && todo.exp_reward > 0) {
      // 캐릭터 이름(닉네임)으로 캐릭터 조회
      const character = await this.prisma.characters.findUnique({
        where: {
          user_id_character_name: {
            user_id: todo.user_id,
            character_name: user.nickname,
          },
        },
      });
      if (character) {
        const expToRemove = todo.exp_reward;
        let newExp = character.exp - expToRemove;
        let newLevel = character.level;
        // 레벨 다운 로직
        while (newExp < 0 && newLevel > 1) {
          const prevLevelRequirement =
            await this.prisma.level_requirements.findUnique({
              where: { level: newLevel - 1 },
            });
          if (!prevLevelRequirement) break;
          newLevel -= 1;
          newExp += prevLevelRequirement.required_exp;
          leveledDown = true;
        }
        if (newExp < 0) newExp = 0;
        await this.prisma.characters.update({
          where: { character_id: character.character_id },
          data: {
            exp: newExp,
            level: newLevel,
            updated_at: new Date(),
          },
        });
        await this.prisma.exp_logs.create({
          data: {
            user_id: todo.user_id,
            todo_id: todo.todo_id,
            exp: -todo.exp_reward,
            created_at: new Date(),
            character_id: character.character_id,
          },
        });
      }
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
    return { meesage: '삭제 완료', leveledDown };
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
