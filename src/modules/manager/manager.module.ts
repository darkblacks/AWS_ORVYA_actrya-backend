import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerDemandEntity, ManagerEmployeeEntity, UserEntity } from '../../database/entities';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ManagerEmployeeEntity, ManagerDemandEntity])],
  controllers: [ManagerController],
  providers: [ManagerService],
})
export class ManagerModule {}
