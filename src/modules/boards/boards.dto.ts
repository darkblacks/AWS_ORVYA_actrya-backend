import { IsOptional, IsString, IsUUID } from 'class-validator';
export class UpdateBoardDto { @IsOptional() @IsString() name?:string; @IsOptional() @IsUUID() kanbanLayoutId?:string; @IsOptional() @IsUUID() cardLayoutId?:string; }
