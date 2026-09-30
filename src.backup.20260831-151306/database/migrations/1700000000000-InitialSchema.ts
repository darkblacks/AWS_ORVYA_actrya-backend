import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await q.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(150) NOT NULL,
        email varchar(255) NOT NULL UNIQUE, password_hash text NOT NULL, active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(255) NOT NULL, description text,
        created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
      );
      CREATE TABLE project_members (
        project_id uuid NOT NULL REFERENCES projects(id), user_id uuid NOT NULL REFERENCES users(id),
        role varchar(30) NOT NULL DEFAULT 'editor', created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY(project_id, user_id), CHECK (role IN ('owner','editor','viewer'))
      );
      CREATE TABLE kanban_layouts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(255) NOT NULL, created_by uuid REFERENCES users(id),
        is_system boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
      );
      CREATE TABLE kanban_layout_columns (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kanban_layout_id uuid NOT NULL REFERENCES kanban_layouts(id),
        name varchar(150) NOT NULL, position integer NOT NULL, is_initial boolean NOT NULL DEFAULT false,
        is_final boolean NOT NULL DEFAULT false, config jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(kanban_layout_id, position)
      );
      CREATE TABLE card_layouts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(255) NOT NULL, created_by uuid REFERENCES users(id),
        is_system boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
      );
      CREATE TABLE card_layout_fields (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), card_layout_id uuid NOT NULL REFERENCES card_layouts(id),
        field_key varchar(100) NOT NULL, label varchar(150) NOT NULL, field_type varchar(50) NOT NULL,
        position integer NOT NULL, required boolean NOT NULL DEFAULT false, show_in_kanban boolean NOT NULL DEFAULT true,
        config jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(card_layout_id, field_key), UNIQUE(card_layout_id, position)
      );
      CREATE TABLE project_instances (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id),
        instance_level smallint NOT NULL CHECK(instance_level BETWEEN 1 AND 3), name varchar(100) NOT NULL,
        default_kanban_layout_id uuid NOT NULL REFERENCES kanban_layouts(id),
        default_card_layout_id uuid NOT NULL REFERENCES card_layouts(id), enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(project_id, instance_level)
      );
      CREATE TABLE boards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id),
        project_instance_id uuid NOT NULL REFERENCES project_instances(id), parent_item_id uuid,
        name varchar(255), kanban_layout_id uuid NOT NULL REFERENCES kanban_layouts(id),
        card_layout_id uuid NOT NULL REFERENCES card_layouts(id), created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
      );
      CREATE UNIQUE INDEX uq_board_parent_instance ON boards(project_id, project_instance_id, parent_item_id) WHERE deleted_at IS NULL AND parent_item_id IS NOT NULL;
      CREATE UNIQUE INDEX uq_board_root_instance ON boards(project_id, project_instance_id) WHERE deleted_at IS NULL AND parent_item_id IS NULL;

      CREATE TABLE project_items (
        project_id uuid NOT NULL REFERENCES projects(id), id uuid NOT NULL, board_id uuid NOT NULL REFERENCES boards(id),
        parent_item_id uuid, instance_level smallint NOT NULL CHECK(instance_level BETWEEN 1 AND 3),
        column_id uuid NOT NULL REFERENCES kanban_layout_columns(id), card_layout_id uuid NOT NULL REFERENCES card_layouts(id),
        position numeric(30,10) NOT NULL DEFAULT 1000, data jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
        PRIMARY KEY(project_id, id)
      ) PARTITION BY LIST(project_id);
      CREATE INDEX idx_project_items_board ON project_items(project_id, board_id, deleted_at, position);
      CREATE INDEX idx_project_items_parent ON project_items(project_id, parent_item_id) WHERE deleted_at IS NULL;

      CREATE TABLE actions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid REFERENCES projects(id), user_id uuid REFERENCES users(id),
        entity_type varchar(50) NOT NULL, entity_id uuid, action_type varchar(50) NOT NULL,
        before_data jsonb, after_data jsonb, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_actions_project_created ON actions(project_id, created_at DESC);
      CREATE INDEX idx_actions_entity ON actions(entity_type, entity_id, created_at DESC);

      CREATE TABLE files (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid REFERENCES projects(id), uploaded_by uuid NOT NULL REFERENCES users(id),
        original_name text NOT NULL, mime_type varchar(150) NOT NULL, size_bytes bigint NOT NULL, storage_key text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
      );
    `);

    await q.query(`
      INSERT INTO kanban_layouts(id,name,is_system) VALUES ('00000000-0000-4000-8000-000000000001','Kanban padrão',true);
      INSERT INTO kanban_layout_columns(id,kanban_layout_id,name,position,is_initial,is_final) VALUES
        ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','Demanda',1,true,false),
        ('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001','Andamento',2,false,false),
        ('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000001','Realizado',3,false,true);
      INSERT INTO card_layouts(id,name,is_system) VALUES ('00000000-0000-4000-8000-000000000002','Card padrão',true);
      INSERT INTO card_layout_fields(id,card_layout_id,field_key,label,field_type,position,required,show_in_kanban) VALUES
        ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000002','title','Título','text',1,true,true),
        ('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000002','description','Descrição','textarea',2,false,false);
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS files, actions, project_items, boards, project_instances, card_layout_fields, card_layouts, kanban_layout_columns, kanban_layouts, project_members, projects, users CASCADE`);
  }
}
