import { Module } from '@nestjs/common'; import { TypeOrmModule } from '@nestjs/typeorm'; import { FileEntity } from '../../database/entities'; import { AuthModule } from '../auth/auth.module'; import { FilesController } from './files.controller';
@Module({imports:[TypeOrmModule.forFeature([FileEntity]),AuthModule],controllers:[FilesController]})export class FilesModule{}
