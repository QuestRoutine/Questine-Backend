import { PrismaService } from 'src/prisma.service';

export class CalculateStreak {
  constructor(private readonly prisma: PrismaService) {}
  async calculateStreak(
    userId: number,
  ): Promise<{ longestStreak: number; currentStreak: number }> {
    const data = await this.prisma.todos.findMany({
      where: {
        user_id: userId,
        completed: true,
      },
      select: {
        completed_at: true,
      },
      orderBy: {
        completed_at: 'desc',
      },
    });

    const dates = Array.from(
      new Set(data.map((t) => t.completed_at.toISOString().slice(0, 10))),
    );

    let streak = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    const today = new Date();
    let broken = false;

    // streak 계산
    for (let i = 0; i < dates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const expected = checkDate.toISOString().slice(0, 10);

      if (dates.includes(expected)) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        if (!broken) {
          currentStreak = streak;
          broken = true;
        }
        streak = 0;
      }
    }
    if (!broken) currentStreak = streak;
    return { longestStreak: maxStreak, currentStreak };
  }
}
