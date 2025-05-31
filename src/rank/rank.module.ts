import { Module } from '@nestjs/common';
import { RankService } from './rank.service';
import { RankController } from './rank.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RankCronService } from './rank-cron.service';

@Module({
  imports: [AuthModule, ScheduleModule.forRoot()],
  controllers: [RankController],
  providers: [RankService, PrismaService, RankCronService],
})
export class RankModule {}
