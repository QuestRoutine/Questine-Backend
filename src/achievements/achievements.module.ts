import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementController } from './achievements.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [AchievementController],
  providers: [AchievementsService, PrismaService],
})
export class AchievementsModule {}
