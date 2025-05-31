import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TodoModule } from './todo/todo.module';
import { AchievementsModule } from './achievements/achievements.module';
import { CharactersModule } from './characters/characters.module';
import { RankModule } from './rank/rank.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    TodoModule,
    AchievementsModule,
    CharactersModule,
    RankModule,
  ],
  controllers: [],
  providers: [ConfigService],
})
export class AppModule {}
