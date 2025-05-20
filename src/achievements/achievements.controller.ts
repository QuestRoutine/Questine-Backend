import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/common/user.decorator';
import { users } from 'generated/prisma';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('/')
  @UseGuards(AuthGuard())
  findAllAchievements(@User() user: users) {
    return this.achievementsService.findAllAchievements(user);
  }

  @Get('/user')
  @UseGuards(AuthGuard())
  getUserAchievements(@User() user: users) {
    return this.achievementsService.getUserAchievements(user);
  }

  @Get('/user/:achievementId')
  @UseGuards(AuthGuard())
  getUserAchievementDetail(@User() user: users) {
    return this.achievementsService.getUserAchievementDetail(user);
  }

  @Post('/unlock/:achievementId')
  @UseGuards(AuthGuard())
  unlockAchievement(@User() user: users, @Param('achievementId') id: string) {
    return this.achievementsService.unlockAchievement(user, +id);
  }
}
