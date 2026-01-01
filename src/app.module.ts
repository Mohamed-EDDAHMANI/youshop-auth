import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './services/redis.service';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users/users.controller';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    PrismaModule,
    WinstonModule.forRoot(winstonConfig),
  ],
  controllers: [AppController, UsersController],
  providers: [
    AppService,
    RedisService,
  ],
})
export class AppModule {}
