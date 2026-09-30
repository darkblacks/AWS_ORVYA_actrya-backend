import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
import { ManagerService } from './manager.service';
import { CreateManagerDemandDto, SetManagerTeamDto } from './manager.dto';

@ApiTags('Modo chefe')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('manager')
export class ManagerController {
  constructor(private readonly service: ManagerService) {}

  @Get('team') team(@CurrentUser() u: AuthUser) { return this.service.team(u.id); }
  @Post('team') addTeam(@CurrentUser() u: AuthUser, @Body() dto: SetManagerTeamDto) { return this.service.addTeam(u.id, dto); }
  @Delete('team/:employeeId') removeTeam(@CurrentUser() u: AuthUser, @Param('employeeId') employeeId: string) { return this.service.removeTeam(u.id, employeeId); }
  @Post('demands') createDemand(@CurrentUser() u: AuthUser, @Body() dto: CreateManagerDemandDto) { return this.service.createDemand(u.id, dto); }
  @Get('demands') demands(@CurrentUser() u: AuthUser) { return this.service.listDemands(u.id); }
}
