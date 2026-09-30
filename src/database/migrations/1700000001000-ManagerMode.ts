import { MigrationInterface, QueryRunner } from 'typeorm';

export class ManagerMode1700000001000 implements MigrationInterface {
  name = 'ManagerMode1700000001000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS user_type varchar(20) NOT NULL DEFAULT 'employee';

      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT chk_users_user_type CHECK (user_type IN ('manager','employee'));
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS manager_employees (
        manager_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY(manager_id, employee_id),
        CHECK (manager_id <> employee_id)
      );

      CREATE TABLE IF NOT EXISTS user_presence (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        last_seen_at timestamptz,
        is_working boolean NOT NULL DEFAULT false,
        work_started_at timestamptz,
        current_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
        current_item_id uuid,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS work_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        started_at timestamptz NOT NULL,
        ended_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_work_sessions_user_started ON work_sessions(user_id, started_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_work_session_open ON work_sessions(user_id) WHERE ended_at IS NULL;

      CREATE TABLE IF NOT EXISTS manager_demands (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        manager_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        description text,
        priority varchar(20) NOT NULL DEFAULT 'normal',
        status varchar(30) NOT NULL DEFAULT 'new',
        due_at timestamptz,
        linked_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
        linked_item_id uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (priority IN ('low','normal','high','urgent')),
        CHECK (status IN ('new','accepted','in_progress','done','cancelled'))
      );
      CREATE INDEX IF NOT EXISTS idx_manager_demands_employee ON manager_demands(employee_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_manager_demands_manager ON manager_demands(manager_id, created_at DESC);

      ALTER TABLE project_items ALTER COLUMN position TYPE numeric(30,10);
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DROP TABLE IF EXISTS manager_demands;
      DROP TABLE IF EXISTS work_sessions;
      DROP TABLE IF EXISTS user_presence;
      DROP TABLE IF EXISTS manager_employees;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_user_type;
      ALTER TABLE users DROP COLUMN IF EXISTS user_type;
    `);
  }
}
