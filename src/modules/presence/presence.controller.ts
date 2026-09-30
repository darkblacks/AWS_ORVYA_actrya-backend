import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
import { PresenceService } from './presence.service';
import { SetCurrentWorkDto } from './presence.dto';

@ApiTags('Presença e ponto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('presence')
export class PresenceController {
  constructor(private readonly service: PresenceService) {}

  @Post('heartbeat') heartbeat(@CurrentUser() u: AuthUser) { return this.service.heartbeat(u.id); }
  @Get('me') me(@CurrentUser() u: AuthUser) { return this.service.me(u.id); }
  @Post('work/start') start(@CurrentUser() u: AuthUser) { return this.service.start(u.id); }
  @Post('work/stop') stop(@CurrentUser() u: AuthUser) { return this.service.stop(u.id); }
  @Patch('current') current(@CurrentUser() u: AuthUser, @Body() dto: SetCurrentWorkDto) { return this.service.setCurrent(u.id, dto); }
}
