import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
@Injectable()
export class AuthService {
  constructor(@InjectRepository(UserEntity) private readonly users:Repository<UserEntity>,private readonly jwt:JwtService,private readonly audit:AuditService){}
  async register(dto:RegisterDto){
    const email=dto.email.trim().toLowerCase();
    if(await this.users.findOne({where:{email}})) throw new ConflictException('E-mail já cadastrado.');
    const user=await this.users.save(this.users.create({name:dto.name.trim(),email,passwordHash:await bcrypt.hash(dto.password,12),active:true}));
    await this.audit.log({userId:user.id,entityType:'USER',entityId:user.id,actionType:'REGISTER',after:{id:user.id,email:user.email,name:user.name}});
    return this.tokenResponse(user);
  }
  async login(dto:LoginDto){
    const user=await this.users.createQueryBuilder('u').addSelect('u.passwordHash').where('LOWER(u.email)=LOWER(:email)',{email:dto.email}).andWhere('u.active=true').getOne();
    if(!user || !(await bcrypt.compare(dto.password,user.passwordHash))) throw new UnauthorizedException('E-mail ou senha inválidos.');
    await this.audit.log({userId:user.id,entityType:'USER',entityId:user.id,actionType:'LOGIN'});
    return this.tokenResponse(user);
  }

  async updateProfile(userId:string,dto:UpdateProfileDto){
    const user=await this.users.findOne({where:{id:userId,active:true}}); if(!user)throw new NotFoundException();
    const before={id:user.id,name:user.name,email:user.email};
    if(dto.email && dto.email.toLowerCase()!==user.email.toLowerCase()){
      const email=dto.email.trim().toLowerCase(); if(await this.users.findOne({where:{email}}))throw new ConflictException('E-mail já cadastrado.'); user.email=email;
    }
    if(dto.name)user.name=dto.name.trim();
    const saved=await this.users.save(user); await this.audit.log({userId,entityType:'USER',entityId:userId,actionType:'UPDATE_PROFILE',before,after:{id:saved.id,name:saved.name,email:saved.email}}); return {id:saved.id,name:saved.name,email:saved.email};
  }
  async changePassword(userId:string,dto:ChangePasswordDto){
    const user=await this.users.createQueryBuilder('u').addSelect('u.passwordHash').where('u.id=:id',{id:userId}).andWhere('u.active=true').getOne();
    if(!user)throw new NotFoundException(); if(!(await bcrypt.compare(dto.currentPassword,user.passwordHash)))throw new UnauthorizedException('Senha atual inválida.');
    user.passwordHash=await bcrypt.hash(dto.newPassword,12); await this.users.save(user); await this.audit.log({userId,entityType:'USER',entityId:userId,actionType:'CHANGE_PASSWORD'}); return {ok:true};
  }
  async deactivate(userId:string){const user=await this.users.findOne({where:{id:userId,active:true}});if(!user)throw new NotFoundException();user.active=false;await this.users.save(user);await this.audit.log({userId,entityType:'USER',entityId:userId,actionType:'DEACTIVATE'});return {ok:true};}

  private async tokenResponse(user:UserEntity){ const accessToken=await this.jwt.signAsync({sub:user.id,email:user.email}); return {tokenType:'Bearer',accessToken,user:{id:user.id,name:user.name,email:user.email}}; }
}
