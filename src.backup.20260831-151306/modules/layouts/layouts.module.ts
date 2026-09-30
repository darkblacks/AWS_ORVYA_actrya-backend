import { Module } from '@nestjs/common'; import { TypeOrmModule } from '@nestjs/typeorm';
import { CardLayoutEntity, CardLayoutFieldEntity, KanbanLayoutColumnEntity, KanbanLayoutEntity } from '../../database/entities';
import { AuthModule } from '../auth/auth.module'; import { LayoutsController } from './layouts.controller'; import { LayoutsService } from './layouts.service';
@Module({imports:[TypeOrmModule.forFeature([KanbanLayoutEntity,KanbanLayoutColumnEntity,CardLayoutEntity,CardLayoutFieldEntity]),AuthModule],controllers:[LayoutsController],providers:[LayoutsService]}) export class LayoutsModule{}
