import { IsNumber, IsObject, IsOptional, IsUUID } from 'class-validator';
export class CreateItemDto { @IsUUID() boardId!:string; @IsOptional() @IsUUID() columnId?:string; @IsOptional() @IsUUID() cardLayoutId?:string; @IsOptional() @IsNumber() position?:number; @IsObject() data!:Record<string,unknown>; }
export class UpdateItemDto { @IsOptional() @IsUUID() columnId?:string; @IsOptional() @IsUUID() cardLayoutId?:string; @IsOptional() @IsNumber() position?:number; @IsOptional() @IsObject() data?:Record<string,unknown>; }
