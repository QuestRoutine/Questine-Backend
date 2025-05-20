import { Injectable } from '@nestjs/common';
import { users } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllAchievements(user: users) {
    return await this.prisma.achievements.findMany();
  }

  /**
   * 사용자가 획득한 업적 목록 조회
   * @param user 현재 사용자 정보
   * @returns 사용자가 획득한 업적 목록과 성공/실패 여부
   */
  async getUserAchievements(user: users) {
    try {
      // Prisma의 include 기능을 사용하여 한 번의 쿼리로 사용자 업적과 업적 정보를 함께 조회
      const userAchievements = await this.prisma.user_achievements.findMany({
        where: {
          user_id: user.user_id,
        },
        include: {
          achievements: true, // 관련된 achievements 데이터를 함께 가져옴
        },
        orderBy: {
          achieved_at: 'desc',
        },
      });

      if (userAchievements.length === 0) {
        return {
          success: true,
          message: '획득한 업적이 없습니다.',
          data: [],
        };
      }

      const formattedAchievements = userAchievements.map((userAchievement) => {
        const { achievements, ...userAchievementData } = userAchievement;

        return {
          ...userAchievementData,
          title: achievements.title,
          description: achievements.description,
          icon: achievements.icon,
          max_progress: achievements.max_progress,
          reward_xp: achievements.reward_xp,
          reward_gold: achievements.reward_gold,
          created_at: achievements.created_at,
          updated_at: achievements.updated_at,
        };
      });

      return {
        success: true,
        message: '내가 획득한 업적 목록을 불러왔습니다.',
        data: formattedAchievements,
      };
    } catch (error) {
      console.error('업적 조회 중 오류 발생:', error);
      return {
        success: false,
        message: '업적 목록을 불러오는 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  async getUserAchievementDetail(user: users) {
    return;
  }

  async unlockAchievement(user: users, id: number) {
    try {
      const achievement = await this.prisma.achievements.findUnique({
        where: {
          achievement_id: id,
        },
      });

      if (!achievement) {
        return {
          success: false,
          message: '업적을 찾을 수 없습니다!',
        };
      }

      // 사용자가 이미 해당 업적을 획득했는지 확인
      const existingAchievement = await this.prisma.user_achievements.findFirst(
        {
          where: {
            user_id: user.user_id,
            achievement_id: id,
          },
        },
      );

      if (existingAchievement) {
        return {
          success: false,
          message: '이미 획득한 업적입니다.',
          data: existingAchievement,
        };
      }

      // 업적 해금 기록 생성
      const unlocked = await this.prisma.user_achievements.create({
        data: {
          user_id: user.user_id,
          achievement_id: id,
          achieved_at: new Date(),
        },
      });

      return {
        success: true,
        message: '업적을 달성했습니다!',
        data: unlocked,
      };
    } catch (error) {
      console.error('업적 해금 중 오류 발생:', error);
      return {
        success: false,
        message: '업적 해금 처리 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
