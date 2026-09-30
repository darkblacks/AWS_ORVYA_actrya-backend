import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { DemandStatus } from '../../database/entities';

export class UpdateDemandDto {
  @IsOptional() @IsIn(['new','accepted','in_progress','done','cancelled']) status?: DemandStatus;
  @IsOptional() @IsUUID() linkedProjectId?: string | null;
  @IsOptional() @IsUUID() linkedItemId?: string | null;
}
