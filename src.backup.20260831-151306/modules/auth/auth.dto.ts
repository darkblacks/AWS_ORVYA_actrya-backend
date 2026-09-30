import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterDto { @IsString() @MinLength(2) name!:string; @IsEmail() email!:string; @IsString() @MinLength(6) password!:string; }
export class LoginDto { @IsEmail() email!:string; @IsString() password!:string; }
export class ChangePasswordDto { @IsString() currentPassword!:string; @IsString() @MinLength(6) newPassword!:string; }

export class UpdateProfileDto { @IsOptional() @IsString() @MinLength(2) name?:string; @IsOptional() @IsEmail() email?:string; }
