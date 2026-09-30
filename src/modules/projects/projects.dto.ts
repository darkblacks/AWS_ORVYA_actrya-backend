import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto { @IsString() @MinLength(1) @MaxLength(255) name!:string; @IsOptional() @IsString() description?:string; }
export class UpdateProjectDto { @IsOptional() @IsString() @MaxLength(255) name?:string; @IsOptional() @IsString() description?:string; }
export class UpdateInstanceDto { @IsOptional() @IsString() name?:string; @IsOptional() @IsUUID() kanbanLayoutId?:string; @IsOptional() @IsUUID() cardLayoutId?:string; @IsOptional() @IsBoolean() enabled?:boolean; }

export class AddMembersDto {
  @IsArray() @ArrayMinSize(1) @IsUUID('4', { each: true }) userIds!: string[];
  @IsOptional() @IsIn(['editor','viewer']) role?: 'editor'|'viewer';
}
