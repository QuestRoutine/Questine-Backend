import { Injectable } from '@nestjs/common';
import { users } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { AchievementConditions } from './achievement-conditions';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AchievementsService {
  private achievementConditions: AchievementConditions;

  constructor(private readonly prisma: PrismaService) {
    this.achievementConditions = new AchievementConditions(this.prisma);
  }

  /**
   * 모든 업적 및 진행 상황 조회
   * * is_unlocked: 업적 해금 여부
   * * unlocked_at: 업적이 해금된 날짜
   * * progress: 업적의 진행 상황 (0 ~ max_progress)
   */

  async getAllAchievements(user: users) {
    try {
      const allAchievements = await this.prisma.achievements.findMany();
      const userAchievements = await this.prisma.achievement_progress.findMany({
        where: {
          user_id: user.user_id,
        },
        include: {
          achievements: true,
        },
        orderBy: {
          unlocked_at: 'desc',
        },
      });

      // 해당 업적을 해금한 유저 수 조회
      const achievementCount = await this.prisma.achievement_progress.groupBy({
        by: ['achievement_id'],
        where: {
          is_unlocked: true,
        },
        _count: {
          user_id: true,
        },
      });

      const achievementCountMap = new Map(
        achievementCount.map((count) => [
          count.achievement_id,
          count._count.user_id,
        ]),
      );
      const formattedAchievements = allAchievements.map((achievement) => {
        const userAchievement = userAchievements.find(
          (progress) => progress.achievement_id === achievement.achievement_id,
        );
        return {
          ...achievement,
          is_unlocked: userAchievement ? userAchievement.is_unlocked : false,
          unlocked_at: userAchievement ? userAchievement.unlocked_at : null,
          progress: userAchievement ? userAchievement.progress : 0,
          unlocked_user_count:
            achievementCountMap.get(achievement.achievement_id) || 0,
          user_id: user.user_id,
        };
      });

      return {
        message: '업적 목록을 불러왔습니다.',
        data: formattedAchievements,
      };
    } catch (error) {
      console.error('업적 조회 중 오류 발생:', error);
      return {
        message: '업적 목록을 불러오는 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  @OnEvent('todo.completed')
  async handleTodoCompleted(payload: { user: users; todoId: number }) {
    const { user } = payload;
    const relatedAchievementIds = Array.from({ length: 10 }, (_, i) => i + 1);

    for (const id of relatedAchievementIds) {
      await this.unlockAchievement(user, id);
    }
  }

  async unlockAchievement(user: users, id: number) {
    try {
      // 업적 존재 여부 확인
      const achievement = await this.prisma.achievements.findUnique({
        where: { achievement_id: id },
      });
      if (!achievement) {
        return {
          message: '업적을 찾을 수 없습니다!',
        };
      }

      // 해금 조건 확인
      const isConditionMet =
        await this.achievementConditions.checkAchievementConditions(
          user,
          achievement,
        );
      if (!isConditionMet) {
        return { message: '업적 조건을 만족하지 않습니다.' };
      }

      // 해금 여부 확인
      const existingAchievement =
        await this.prisma.achievement_progress.findFirst({
          where: { user_id: user.user_id, achievement_id: id },
        });
      if (existingAchievement) {
        return {
          message: '이미 획득한 업적입니다.',
          data: existingAchievement,
        };
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        // 업적 해금 기록 생성
        const unlocked = await prisma.achievement_progress.create({
          data: {
            user_id: user.user_id,
            achievement_id: id,
            is_unlocked: true,
            progress: achievement.max_progress ?? 1,
            unlocked_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // 캐릭터 정보 조회
        const character = await prisma.characters.findFirst({
          where: {
            user_id: user.user_id,
            character_name: user.nickname,
          },
          select: { character_id: true },
        });
        if (!character) throw new Error('사용자 캐릭터를 찾을 수 없습니다.');

        // 캐릭터 보상 지급 (경험치, 골드)
        await prisma.characters.update({
          where: { character_id: character.character_id },
          data: {
            exp: { increment: achievement.reward_xp ?? 0 },
            gold: { increment: achievement.reward_gold ?? 0 },
            updated_at: new Date(),
          },
        });

        return unlocked;
      });

      return {
        success: true,
        message: '업적을 달성했습니다!',
        data: result,
      };
    } catch (error) {
      console.error('업적 해금 중 오류 발생:', error);
      return {
        message: '업적 해금 처리 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
