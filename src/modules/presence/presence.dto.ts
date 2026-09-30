import { IsOptional, IsUUID } from 'class-validator';

export class SetCurrentWorkDto {
  @IsOptional() @IsUUID() projectId?: string | null;
  @IsOptional() @IsUUID() itemId?: string | null;
}
