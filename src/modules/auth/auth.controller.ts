import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { AuthUser } from '../../common/auth-user';
@ApiTags('Autenticação') @Controller('auth')
export class AuthController {
  constructor(private readonly service:AuthService){}
  @Post('register') register(@Body() dto:RegisterDto){return this.service.register(dto)}
  @Post('login') login(@Body() dto:LoginDto){return this.service.login(dto)}
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get('me') me(@CurrentUser() user:AuthUser){return user}
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Patch('me') updateMe(@CurrentUser() user:AuthUser,@Body() dto:UpdateProfileDto){return this.service.updateProfile(user.id,dto)}
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Patch('password') password(@CurrentUser() user:AuthUser,@Body() dto:ChangePasswordDto){return this.service.changePassword(user.id,dto)}
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Delete('me') deactivate(@CurrentUser() user:AuthUser){return this.service.deactivate(user.id)}
}
