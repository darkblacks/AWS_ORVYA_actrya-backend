import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ManagerDemandEntity, ManagerEmployeeEntity, UserEntity } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { CreateManagerDemandDto, SetManagerTeamDto } from './manager.dto';

@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(ManagerEmployeeEntity) private readonly links: Repository<ManagerEmployeeEntity>,
    @InjectRepository(ManagerDemandEntity) private readonly demands: Repository<ManagerDemandEntity>,
    private readonly db: DataSource,
    private readonly audit: AuditService,
  ) {}

  private async assertManager(userId: string) {
    const user = await this.users.findOne({ where: { id: userId, active: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.userType !== 'manager') throw new ForbiddenException('Acesso disponível apenas no modo chefe.');
    return user;
  }

  async addTeam(managerId: string, dto: SetManagerTeamDto) {
    await this.assertManager(managerId);
    const ids = [...new Set(dto.employeeIds)].filter((id) => id !== managerId);
    const employees = await this.users.find({ where: { id: In(ids), active: true, userType: 'employee' } });
    if (employees.length !== ids.length) throw new NotFoundException('Um ou mais funcionários não foram encontrados.');

    await this.links.upsert(ids.map((employeeId) => ({ managerId, employeeId })), ['managerId','employeeId']);
    await this.audit.log({ userId: managerId, entityType: 'MANAGER_TEAM', entityId: null, actionType: 'ADD_EMPLOYEES', after: { employeeIds: ids } });
    return this.team(managerId);
  }

  async removeTeam(managerId: string, employeeId: string) {
    await this.assertManager(managerId);
    await this.links.delete({ managerId, employeeId });
    await this.audit.log({ userId: managerId, entityType: 'MANAGER_TEAM', entityId: employeeId, actionType: 'REMOVE_EMPLOYEE' });
    return { ok: true };
  }

  async team(managerId: string) {
    await this.assertManager(managerId);
    return this.db.query(`
      SELECT
        u.id, u.name, u.email, u.user_type AS "userType",
        COALESCE(up.is_working, false) AS "isWorking",
        up.work_started_at AS "workStartedAt",
        up.last_seen_at AS "lastSeenAt",
        (up.last_seen_at IS NOT NULL AND up.last_seen_at > now() - interval '2 minutes') AS online,
        up.current_project_id AS "currentProjectId",
        p.name AS "currentProjectName",
        up.current_item_id AS "currentItemId",
        pi.data->>'title' AS "currentItemTitle"
      FROM manager_employees me
      JOIN users u ON u.id=me.employee_id AND u.active=true
      LEFT JOIN user_presence up ON up.user_id=u.id
      LEFT JOIN projects p ON p.id=up.current_project_id AND p.deleted_at IS NULL
      LEFT JOIN project_items pi ON pi.project_id=up.current_project_id AND pi.id=up.current_item_id AND pi.deleted_at IS NULL
      WHERE me.manager_id=$1
      ORDER BY u.name ASC
    `, [managerId]);
  }

  async createDemand(managerId: string, dto: CreateManagerDemandDto) {
    await this.assertManager(managerId);
    const link = await this.links.findOne({ where: { managerId, employeeId: dto.employeeId } });
    if (!link) throw new ForbiddenException('Esse funcionário não está associado a este chefe.');

    const demand = await this.demands.save(this.demands.create({
      managerId,
      employeeId: dto.employeeId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      priority: dto.priority ?? 'normal',
      status: 'new',
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      linkedProjectId: null,
      linkedItemId: null,
    }));

    await this.audit.log({ userId: managerId, entityType: 'MANAGER_DEMAND', entityId: demand.id, actionType: 'CREATE', after: { id: demand.id, employeeId: demand.employeeId, title: demand.title, priority: demand.priority, status: demand.status } });
    return demand;
  }

  async listDemands(managerId: string) {
    await this.assertManager(managerId);
    return this.db.query(`
      SELECT d.*, u.name AS employee_name, u.email AS employee_email
      FROM manager_demands d
      JOIN users u ON u.id=d.employee_id
      WHERE d.manager_id=$1
      ORDER BY d.created_at DESC
    `, [managerId]);
  }
}
