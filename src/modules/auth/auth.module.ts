import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../database/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
@Global()
@Module({
  imports:[TypeOrmModule.forFeature([UserEntity]), JwtModule.registerAsync({imports:[ConfigModule],inject:[ConfigService],useFactory:(c:ConfigService)=>({secret:c.getOrThrow<string>('JWT_SECRET'),signOptions:{expiresIn:c.get<string>('JWT_EXPIRES_IN','7d') as any}})})],
  controllers:[AuthController], providers:[AuthService,JwtAuthGuard], exports:[JwtAuthGuard,JwtModule]
}) export class AuthModule {}
