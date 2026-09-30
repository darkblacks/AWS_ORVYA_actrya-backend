import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUUID, Matches, Min, ValidateNested } from 'class-validator';
export class KanbanColumnInput { @IsOptional() @IsUUID() id?:string; @IsString() name!:string; @IsInt() @Min(1) position!:number; @IsOptional() @IsBoolean() isInitial?:boolean; @IsOptional() @IsBoolean() isFinal?:boolean; @IsOptional() @IsObject() config?:Record<string,unknown>; }
export class CreateKanbanLayoutDto { @IsString() name!:string; @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>KanbanColumnInput) columns!:KanbanColumnInput[]; }
export class CardFieldInput { @IsOptional() @IsUUID() id?:string; @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/) fieldKey!:string; @IsString() label!:string; @IsString() fieldType!:string; @IsInt() @Min(1) position!:number; @IsOptional() @IsBoolean() required?:boolean; @IsOptional() @IsBoolean() showInKanban?:boolean; @IsOptional() @IsObject() config?:Record<string,unknown>; }
export class CreateCardLayoutDto { @IsString() name!:string; @IsArray() @ValidateNested({each:true}) @Type(()=>CardFieldInput) fields!:CardFieldInput[]; }
