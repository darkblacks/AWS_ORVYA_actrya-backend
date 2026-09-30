import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity, ProjectEntity, ProjectInstanceEntity, ProjectMemberEntity, UserEntity } from '../../database/entities';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports:[TypeOrmModule.forFeature([ProjectEntity,ProjectMemberEntity,ProjectInstanceEntity,BoardEntity,UserEntity])],
  providers:[ProjectsService],controllers:[ProjectsController],exports:[ProjectsService]
})
export class ProjectsModule {}
