import { ArrayMinSize, IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { DemandPriority } from '../../database/entities';

export class SetManagerTeamDto {
  @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true }) employeeIds!: string[];
}

export class CreateManagerDemandDto {
  @IsUUID() employeeId!: string;
  @IsString() @MinLength(1) @MaxLength(255) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['low','normal','high','urgent']) priority?: DemandPriority;
  @IsOptional() @IsDateString() dueAt?: string;
}
