import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
import { AddMembersDto, CreateProjectDto, UpdateInstanceDto, UpdateProjectDto } from './projects.dto';

@ApiTags('Projetos') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('projects')
export class ProjectsController {
 constructor(private s:ProjectsService){}
 @Post() create(@CurrentUser()u:AuthUser,@Body()d:CreateProjectDto){return this.s.create(u.id,d)}
 @Get() list(@CurrentUser()u:AuthUser){return this.s.list(u.id)}
 @Get(':id') get(@Param('id')id:string,@CurrentUser()u:AuthUser){return this.s.get(id,u.id)}
 @Patch(':id') update(@Param('id')id:string,@CurrentUser()u:AuthUser,@Body()d:UpdateProjectDto){return this.s.update(id,u.id,d)}
 @Delete(':id') remove(@Param('id')id:string,@CurrentUser()u:AuthUser){return this.s.remove(id,u.id)}
 @Patch(':id/instances/:level') updateInstance(@Param('id')id:string,@Param('level',ParseIntPipe) level:number,@CurrentUser()u:AuthUser,@Body()d:UpdateInstanceDto){if(level<1||level>3)throw new Error('level');return this.s.updateInstance(id,level as 1|2|3,u.id,d)}
 @Get(':id/members') members(@Param('id')id:string,@CurrentUser()u:AuthUser){return this.s.listMembers(id,u.id)}
 @Post(':id/members') addMembers(@Param('id')id:string,@CurrentUser()u:AuthUser,@Body()d:AddMembersDto){return this.s.addMembers(id,u.id,d)}
 @Delete(':id/members/:memberId') removeMember(@Param('id')id:string,@Param('memberId')memberId:string,@CurrentUser()u:AuthUser){return this.s.removeMember(id,u.id,memberId)}
}
