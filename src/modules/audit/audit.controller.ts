import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
import { ProjectAccessService } from '../../common/project-access.service';
@ApiTags('Ações') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/actions')
export class AuditController {
  constructor(private readonly audit:AuditService, private readonly access:ProjectAccessService) {}
  @Get() async list(@Param('projectId') projectId:string,@CurrentUser() user:AuthUser,@Query('limit') limit?:string){ await this.access.assertMember(projectId,user.id); return this.audit.list(projectId,Number(limit ?? 100)); }
}


@ApiTags('Ações') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
@Controller('actions')
export class UserAuditController {
  constructor(private readonly audit:AuditService) {}
  @Get() list(@CurrentUser() user:AuthUser,@Query('limit') limit?:string){ return this.audit.listForUser(user.id,Number(limit ?? 100)); }
}
