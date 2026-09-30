import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
import { DemandsService } from './demands.service';
import { UpdateDemandDto } from './demands.dto';

@ApiTags('Demandas recebidas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('demands')
export class DemandsController {
  constructor(private readonly service: DemandsService) {}
  @Get('inbox') inbox(@CurrentUser() u: AuthUser) { return this.service.inbox(u.id); }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateDemandDto) { return this.service.update(u.id, id, dto); }
}
