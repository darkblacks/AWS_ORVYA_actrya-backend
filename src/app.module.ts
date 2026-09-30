import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './database/entities';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { LayoutsModule } from './modules/layouts/layouts.module';
import { BoardsModule } from './modules/boards/boards.module';
import { ItemsModule } from './modules/items/items.module';
import { AuditModule } from './modules/audit/audit.module';
import { FilesModule } from './modules/files/files.module';
import { HealthController } from './health.controller';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { PresenceModule } from './modules/presence/presence.module';
import { ManagerModule } from './modules/manager/manager.module';
import { DemandsModule } from './modules/demands/demands.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities,
        synchronize: false,
        ssl: config.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    CommonModule,
    AuditModule,
    AuthModule,
    ProjectsModule,
    LayoutsModule,
    BoardsModule,
    ItemsModule,
    FilesModule,
    UsersModule,
    PresenceModule,
    ManagerModule,
    DemandsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
