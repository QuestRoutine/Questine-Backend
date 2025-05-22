import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/user.decorator';
import { users } from 'generated/prisma';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementsService: AchievementsService) {}

  // 모든 업적 및 진행 상황 조회
  @Get('/')
  @UseGuards(AuthGuard())
  getAllAchievements(@User() user: users) {
    return this.achievementsService.getAllAchievements(user);
  }

  // 사용자 업적 조회
  @Get('/user')
  @UseGuards(AuthGuard())
  getUserAchievements(@User() user: users) {
    return this.achievementsService.getUserAchievements(user);
  }

  // 업적 해금
  @Post('/unlock/:achievementId')
  @UseGuards(AuthGuard())
  unlockAchievement(@User() user: users, @Param('achievementId') id: string) {
    return this.achievementsService.unlockAchievement(user, +id);
  }
}
