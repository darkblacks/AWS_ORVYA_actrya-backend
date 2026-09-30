import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserPresenceEntity, WorkSessionEntity } from '../../database/entities';
import { ProjectAccessService } from '../../common/project-access.service';
import { AuditService } from '../audit/audit.service';
import { SetCurrentWorkDto } from './presence.dto';

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(UserPresenceEntity) private readonly presence: Repository<UserPresenceEntity>,
    @InjectRepository(WorkSessionEntity) private readonly sessions: Repository<WorkSessionEntity>,
    private readonly db: DataSource,
    private readonly access: ProjectAccessService,
    private readonly audit: AuditService,
  ) {}

  private async ensure(userId: string) {
    let row = await this.presence.findOne({ where: { userId } });
    if (!row) row = await this.presence.save(this.presence.create({ userId, lastSeenAt: new Date(), isWorking: false, workStartedAt: null, currentProjectId: null, currentItemId: null }));
    return row;
  }

  async heartbeat(userId: string) {
    const now = new Date();
    await this.db.query(`
      INSERT INTO user_presence(user_id,last_seen_at,is_working,updated_at)
      VALUES ($1,$2,false,$2)
      ON CONFLICT (user_id) DO UPDATE SET last_seen_at=EXCLUDED.last_seen_at, updated_at=EXCLUDED.updated_at
    `, [userId, now]);
    return { ok: true, lastSeenAt: now.toISOString() };
  }

  async me(userId: string) {
    const row = await this.ensure(userId);
    const online = !!row.lastSeenAt && row.lastSeenAt.getTime() > Date.now() - 120_000;
    return { ...row, online };
  }

  async start(userId: string) {
    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      let row = await tx.getRepository(UserPresenceEntity).findOne({ where: { userId } });
      if (!row) row = tx.getRepository(UserPresenceEntity).create({ userId, lastSeenAt: now, isWorking: false, workStartedAt: null, currentProjectId: null, currentItemId: null });
      if (!row.isWorking) {
        row.isWorking = true;
        row.workStartedAt = now;
        await tx.getRepository(WorkSessionEntity).save(tx.getRepository(WorkSessionEntity).create({ userId, startedAt: now, endedAt: null }));
      }
      row.lastSeenAt = now;
      await tx.getRepository(UserPresenceEntity).save(row);
      return row;
    });
    await this.audit.log({ userId, entityType: 'WORK_SESSION', entityId: null, actionType: 'WORK_START', after: { startedAt: result.workStartedAt?.toISOString() ?? now.toISOString() } });
    return this.me(userId);
  }

  async stop(userId: string) {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      let row = await tx.getRepository(UserPresenceEntity).findOne({ where: { userId } });
      if (!row) row = tx.getRepository(UserPresenceEntity).create({ userId, lastSeenAt: now, isWorking: false, workStartedAt: null, currentProjectId: null, currentItemId: null });
      row.isWorking = false;
      row.workStartedAt = null;
      row.currentProjectId = null;
      row.currentItemId = null;
      row.lastSeenAt = now;
      await tx.getRepository(UserPresenceEntity).save(row);
      await tx.query(`UPDATE work_sessions SET ended_at=$2 WHERE user_id=$1 AND ended_at IS NULL`, [userId, now]);
    });
    await this.audit.log({ userId, entityType: 'WORK_SESSION', entityId: null, actionType: 'WORK_STOP', after: { endedAt: now.toISOString() } });
    return this.me(userId);
  }

  async setCurrent(userId: string, dto: SetCurrentWorkDto) {
    const projectId = dto.projectId ?? null;
    const itemId = dto.itemId ?? null;

    if (itemId && !projectId) throw new BadRequestException('projectId é obrigatório quando itemId for informado.');
    if (projectId) {
      await this.access.assertMember(projectId, userId);
      if (itemId) {
        const rows = await this.db.query(`SELECT id FROM project_items WHERE project_id=$1 AND id=$2 AND deleted_at IS NULL LIMIT 1`, [projectId, itemId]);
        if (!rows[0]) throw new BadRequestException('Item não encontrado neste projeto.');
      }
    }

    const row = await this.ensure(userId);
    const before = { currentProjectId: row.currentProjectId, currentItemId: row.currentItemId };
    row.currentProjectId = projectId;
    row.currentItemId = itemId;
    row.lastSeenAt = new Date();
    const saved = await this.presence.save(row);
    await this.audit.log({ userId, projectId, entityType: 'PRESENCE', entityId: userId, actionType: 'SET_CURRENT_WORK', before, after: { currentProjectId: saved.currentProjectId, currentItemId: saved.currentItemId } });
    return this.me(userId);
  }
}
