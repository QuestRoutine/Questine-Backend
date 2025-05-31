import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RankCronService {
  constructor(private readonly prisma: PrismaService) {}

  // 매일 00시에 전체 경험치 랭킹 집계
  @Cron(CronExpression.EVERY_10_SECONDS)
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateExpRanking() {
    const character = await this.prisma.characters.findMany({
      select: {
        user_id: true,
        exp: true,
        level: true,
      },
      orderBy: [{ level: 'desc' }, { exp: 'desc' }],
    });

    let rank = 1;
    for (const user of character) {
      const prevRanking = await this.prisma.user_exp_ranking.findUnique({
        where: { user_id: user.user_id },
        select: {
          level: true,
          total_exp: true,
          calculated_at: true,
        },
      });

      const userInfo = await this.prisma.users.findUnique({
        where: { user_id: user.user_id },
        select: { nickname: true },
      });

      const level = user.level;
      const nickname = userInfo?.nickname ?? null;
      const shouldUpdateCalculatedAt =
        (prevRanking && prevRanking.level !== user.level) ||
        (prevRanking && prevRanking.total_exp !== user.exp);
      const calculatedAtToSave = shouldUpdateCalculatedAt
        ? new Date()
        : (prevRanking?.calculated_at ?? new Date());

      console.log(
        `Updating rank for user ${user.user_id} - Rank: ${rank}, Level: ${level}, Exp: ${user.exp}, Nickname: ${nickname}, Calculated At: ${calculatedAtToSave}`,
      );

      await this.prisma.user_exp_ranking.upsert({
        where: {
          user_id: user.user_id,
        },
        update: {
          total_exp: user.exp,
          rank,
          level,
          nickname,
          calculated_at: calculatedAtToSave,
        },
        create: {
          user_id: user.user_id,
          total_exp: user.exp,
          rank,
          level,
          nickname,
          calculated_at: new Date(),
        },
      });
      rank++;
    }
  }
}
