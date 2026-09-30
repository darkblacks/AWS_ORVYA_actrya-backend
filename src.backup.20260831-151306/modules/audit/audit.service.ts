import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionEntity, JsonObject } from '../../database/entities';
@Injectable()
export class AuditService {
  constructor(@InjectRepository(ActionEntity) private readonly repo: Repository<ActionEntity>) {}
  async log(input: {projectId?:string|null; userId?:string|null; entityType:string; entityId?:string|null; actionType:string; before?:JsonObject|null; after?:JsonObject|null; metadata?:JsonObject}) {
    return this.repo.save(this.repo.create({
      projectId: input.projectId ?? null, userId: input.userId ?? null, entityType: input.entityType,
      entityId: input.entityId ?? null, actionType: input.actionType, beforeData: input.before ?? null,
      afterData: input.after ?? null, metadata: input.metadata ?? {},
    }));
  }
  list(projectId: string, limit = 100) { return this.repo.find({ where:{projectId}, order:{createdAt:'DESC'}, take: Math.min(limit,500) }); }
  listForUser(userId: string, limit = 100) { return this.repo.find({ where:{userId}, order:{createdAt:'DESC'}, take: Math.min(limit,500) }); }
  find(id:string) { return this.repo.findOne({where:{id}}); }
}
