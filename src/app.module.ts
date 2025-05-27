import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TodoModule } from './todo/todo.module';
import { AchievementsModule } from './achievements/achievements.module';
import { CharactersModule } from './characters/characters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    TodoModule,
    AchievementsModule,
    CharactersModule,
  ],
  controllers: [],
  providers: [ConfigService],
})
export class AppModule {}
