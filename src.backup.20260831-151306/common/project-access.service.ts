import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ProjectAccessService {
  constructor(private readonly db: DataSource) {}
  async assertMember(projectId: string, userId: string, write = false): Promise<{role:string}> {
    const rows = await this.db.query(`SELECT pm.role FROM project_members pm JOIN projects p ON p.id=pm.project_id WHERE pm.project_id=$1 AND pm.user_id=$2 AND p.deleted_at IS NULL`, [projectId, userId]) as Array<{role:string}>;
    if (!rows[0]) throw new NotFoundException('Projeto não encontrado ou sem acesso.');
    if (write && rows[0].role === 'viewer') throw new ForbiddenException('Usuário somente leitura.');
    return rows[0];
  }
  async assertOwner(projectId: string, userId: string): Promise<void> {
    const m = await this.assertMember(projectId, userId);
    if (m.role !== 'owner') throw new ForbiddenException('Somente o proprietário pode realizar esta ação.');
  }
}
