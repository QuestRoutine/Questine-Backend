import { achievements, users } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';

export class AchievementConditions {
  constructor(private readonly prisma: PrismaService) {}

  async checkAchievementConditions(
    user: users,
    achievement: achievements,
  ): Promise<boolean> {
    switch (achievement.achievement_id) {
      case 1:
        return this.checkFirstTodoCompleted(user);
      case 2:
        return this.checkThreeDayStreak(user);
      case 3:
        return this.checkThirtyDayStreak(user);
      case 4:
        return this.checkUnstoppable(user);
      case 5:
        return this.checkNightOwl(user);
      case 6:
        return this.checkTwentyTodosInADay(user);
      case 7:
        return this.checkMorningAndAfternoon(user);
      case 8:
        return this.checkMondayThreeTodos(user);
      case 9:
        return this.checkThirtyTodosInADay(user);
      case 10:
        return this.checkAllUncompletedToday(user);
      default:
        return false;
    }
  }

  /**
   * 1. 첫 투두 완료
   * * 조건: 투두 리스트에서 최초로 할 일이 완료했을 때
   */
  private async checkFirstTodoCompleted(user: users): Promise<boolean> {
    const count = await this.prisma.todos.count({
      where: { user_id: user.user_id, completed: true },
    });
    return count >= 1;
  }

  /**
   * 2. 연속 3일 달성 (3일 연속 모든 할 일 완료)
   * * 조건: profile 테이블의 current_streak이 3이상 일때 (3일 연속 할 일 완료)
   */
  private async checkThreeDayStreak(user: users): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: user.user_id },
      select: { current_streak: true },
    });
    return (profile?.current_streak ?? 0) >= 3;
  }

  /**
   * 3. 꾸준함의 대가 (30일 연속)
   * * 조건: profile 테이블의 current_streak이 30이상 일때 (30일 연속 할 일 완료)
   */
  private async checkThirtyDayStreak(user: users): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: user.user_id },
      select: { current_streak: true },
    });
    return (profile?.current_streak ?? 0) >= 30;
  }

  /**
   * 4. 전장의 지배자 (특정 조건: 예시로 100개 이상 할 일 완료)
   * * 조건: todos 테이블에서 completed가 true인 할 일의 개수가 100개 이상일 때
   */
  private async checkUnstoppable(user: users): Promise<boolean> {
    const count = await this.prisma.todos.count({
      where: { user_id: user.user_id, completed: true },
    });
    return count >= 100;
  }

  /**
   * 5. 야행성 (밤 12시 이후에 할 일 완료)
   * * 조건: todos 테이블에서 completed가 true인 할 일의 completed_at이 오늘 0시 이후일 때
   */
  private async checkNightOwl(user: users): Promise<boolean> {
    const todo = await this.prisma.todos.findFirst({
      where: {
        user_id: user.user_id,
        completed: true,
        completed_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // 오늘 0시 이후
        },
      },
      orderBy: { completed_at: 'desc' },
    });
    if (!todo || !todo.completed_at) return false;
    const hour = todo.completed_at.getHours();
    return hour >= 0 && hour < 5; // 0~4시(새벽) 기준, 필요시 0~6시 등으로 조정
  }

  /**
   * 6. 할 일 학살자 (하루에 20개 이상 완료)
   * * 조건: todos 테이블에서 completed가 true인 할 일의 개수가 오늘 하루에 20개 이상일 때
   */
  private async checkTwentyTodosInADay(user: users): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const count = await this.prisma.todos.count({
      where: {
        user_id: user.user_id,
        completed: true,
        completed_at: { gte: today, lt: tomorrow },
      },
    });
    return count >= 20;
  }

  /**
   * 7. 시간의 마법사 (오전, 오후 각각 1개 이상 완료)
   * * 조건: todos 테이블에서 completed가 true인 할 일이 오전(0~12시)과 오후(12~24시)에 각각 1개 이상일 때
   */
  private async checkMorningAndAfternoon(user: users): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const morning = await this.prisma.todos.findFirst({
      where: {
        user_id: user.user_id,
        completed: true,
        completed_at: {
          gte: today,
          lt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            12,
            0,
            0,
          ),
        },
      },
    });
    const afternoon = await this.prisma.todos.findFirst({
      where: {
        user_id: user.user_id,
        completed: true,
        completed_at: {
          gte: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            12,
            0,
            0,
          ),
          lt: tomorrow,
        },
      },
    });
    return !!morning && !!afternoon;
  }

  /**
   * 8. 월요일 증후군 극복자 (월요일에 3개 이상 완료)
   * * 조건: todos 테이블에서 completed가 true인 할 일이 월요일에 3개 이상일 때
   */
  private async checkMondayThreeTodos(user: users): Promise<boolean> {
    const today = new Date();
    const day = today.getDay();
    if (day !== 1) return false; // 월요일만 체크
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const count = await this.prisma.todos.count({
      where: {
        user_id: user.user_id,
        completed: true,
        completed_at: { gte: start, lt: end },
      },
    });
    return count >= 3;
  }

  /**
   * 9. 신이 내린 몰입 (하루 30개 이상 완료)
   * * 조건: todos 테이블에서 completed가 true인 할 일이 하루에 30개 이상일 때
   */
  private async checkThirtyTodosInADay(user: users): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const count = await this.prisma.todos.count({
      where: {
        user_id: user.user_id,
        completed: true,
        completed_at: { gte: today, lt: tomorrow },
      },
    });
    return count >= 30;
  }

  /**
   * 10. 항상 계획은 완벽했다 (오늘 할 일 3개 이상 전부 미완성)
   * * 조건: todos 테이블에서 오늘 생성된 할 일이 3개 이상이고, 모두 completed가 false일 때
   */
  private async checkAllUncompletedToday(user: users): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todos = await this.prisma.todos.findMany({
      where: {
        user_id: user.user_id,
        created_at: { gte: today, lt: tomorrow },
      },
    });
    if (todos.length < 3) return false;
    return todos.every((todo) => !todo.completed);
  }
}
