import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity, ProjectEntity, ProjectInstanceEntity, ProjectMemberEntity } from '../../database/entities';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AuthModule } from '../auth/auth.module';
@Module({imports:[TypeOrmModule.forFeature([ProjectEntity,ProjectMemberEntity,ProjectInstanceEntity,BoardEntity]),AuthModule],providers:[ProjectsService],controllers:[ProjectsController],exports:[ProjectsService]})
export class ProjectsModule {}
