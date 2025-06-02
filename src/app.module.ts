import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TodoModule } from './todo/todo.module';
import { AchievementsModule } from './achievements/achievements.module';
import { CharactersModule } from './characters/characters.module';
import { RankModule } from './rank/rank.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'assets'),
      serveRoot: '/assets/',
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    TodoModule,
    AchievementsModule,
    CharactersModule,
    RankModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
