import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ManagerDemandEntity } from '../../database/entities';
import { ProjectAccessService } from '../../common/project-access.service';
import { AuditService } from '../audit/audit.service';
import { UpdateDemandDto } from './demands.dto';

@Injectable()
export class DemandsService {
  constructor(
    @InjectRepository(ManagerDemandEntity) private readonly demands: Repository<ManagerDemandEntity>,
    private readonly db: DataSource,
    private readonly access: ProjectAccessService,
    private readonly audit: AuditService,
  ) {}

  async inbox(employeeId: string) {
    return this.db.query(`
      SELECT d.*, u.name AS manager_name, u.email AS manager_email
      FROM manager_demands d
      JOIN users u ON u.id=d.manager_id
      WHERE d.employee_id=$1
      ORDER BY CASE d.status WHEN 'new' THEN 0 WHEN 'accepted' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'done' THEN 3 ELSE 4 END,
               d.created_at DESC
    `, [employeeId]);
  }

  async update(employeeId: string, id: string, dto: UpdateDemandDto) {
    const demand = await this.demands.findOne({ where: { id, employeeId } });
    if (!demand) throw new NotFoundException('Demanda não encontrada.');
    const before = { ...demand };

    if (dto.linkedProjectId !== undefined || dto.linkedItemId !== undefined) {
      const projectId = dto.linkedProjectId ?? demand.linkedProjectId;
      const itemId = dto.linkedItemId ?? demand.linkedItemId;
      if (itemId && !projectId) throw new BadRequestException('linkedProjectId é obrigatório para vincular um item.');
      if (projectId) {
        await this.access.assertMember(projectId, employeeId);
        if (itemId) {
          const rows = await this.db.query(`SELECT id FROM project_items WHERE project_id=$1 AND id=$2 AND deleted_at IS NULL LIMIT 1`, [projectId, itemId]);
          if (!rows[0]) throw new BadRequestException('Item não encontrado neste projeto.');
        }
      }
      demand.linkedProjectId = projectId ?? null;
      demand.linkedItemId = itemId ?? null;
    }

    if (dto.status) demand.status = dto.status;
    const saved = await this.demands.save(demand);
    await this.audit.log({ userId: employeeId, projectId: saved.linkedProjectId, entityType: 'MANAGER_DEMAND', entityId: saved.id, actionType: 'UPDATE', before, after: { ...saved } });
    return saved;
  }
}
