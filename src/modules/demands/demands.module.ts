import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerDemandEntity } from '../../database/entities';
import { DemandsController } from './demands.controller';
import { DemandsService } from './demands.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManagerDemandEntity])],
  controllers: [DemandsController],
  providers: [DemandsService],
})
export class DemandsModule {}
