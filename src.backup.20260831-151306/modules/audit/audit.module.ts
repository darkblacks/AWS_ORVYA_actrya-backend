import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../../database/entities';
import { AuditService } from './audit.service';
import { AuditController, UserAuditController } from './audit.controller';

@Global()
@Module({ imports:[TypeOrmModule.forFeature([ActionEntity])], providers:[AuditService], exports:[AuditService], controllers:[AuditController,UserAuditController] })
export class AuditModule {}
