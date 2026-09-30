import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryColumn,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type JsonObject = Record<string, unknown>;

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 150 }) name!: string;
  @Index({ unique: true }) @Column({ length: 255 }) email!: string;
  @Column({ name: 'password_hash', type: 'text', select: false }) passwordHash!: string;
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 255 }) name!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}

@Entity('project_members')
export class ProjectMemberEntity {
  @PrimaryColumn({ name: 'project_id', type: 'uuid' }) projectId!: string;
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ length: 30, default: 'editor' }) role!: 'owner' | 'editor' | 'viewer';
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('kanban_layouts')
export class KanbanLayoutEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 255 }) name!: string;
  @Column({ name: 'created_by', type: 'uuid', nullable: true }) createdBy!: string | null;
  @Column({ name: 'is_system', default: false }) isSystem!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}

@Entity('kanban_layout_columns')
export class KanbanLayoutColumnEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'kanban_layout_id', type: 'uuid' }) kanbanLayoutId!: string;
  @Column({ length: 150 }) name!: string;
  @Column({ type: 'integer' }) position!: number;
  @Column({ name: 'is_initial', default: false }) isInitial!: boolean;
  @Column({ name: 'is_final', default: false }) isFinal!: boolean;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) config!: JsonObject;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('card_layouts')
export class CardLayoutEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 255 }) name!: string;
  @Column({ name: 'created_by', type: 'uuid', nullable: true }) createdBy!: string | null;
  @Column({ name: 'is_system', default: false }) isSystem!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}

@Entity('card_layout_fields')
export class CardLayoutFieldEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'card_layout_id', type: 'uuid' }) cardLayoutId!: string;
  @Column({ name: 'field_key', length: 100 }) fieldKey!: string;
  @Column({ length: 150 }) label!: string;
  @Column({ name: 'field_type', length: 50 }) fieldType!: string;
  @Column({ type: 'integer' }) position!: number;
  @Column({ default: false }) required!: boolean;
  @Column({ name: 'show_in_kanban', default: true }) showInKanban!: boolean;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) config!: JsonObject;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('project_instances')
export class ProjectInstanceEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'project_id', type: 'uuid' }) projectId!: string;
  @Column({ name: 'instance_level', type: 'smallint' }) instanceLevel!: 1 | 2 | 3;
  @Column({ length: 100 }) name!: string;
  @Column({ name: 'default_kanban_layout_id', type: 'uuid' }) defaultKanbanLayoutId!: string;
  @Column({ name: 'default_card_layout_id', type: 'uuid' }) defaultCardLayoutId!: string;
  @Column({ default: true }) enabled!: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}

@Entity('boards')
export class BoardEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'project_id', type: 'uuid' }) projectId!: string;
  @Column({ name: 'project_instance_id', type: 'uuid' }) projectInstanceId!: string;
  @Column({ name: 'parent_item_id', type: 'uuid', nullable: true }) parentItemId!: string | null;
  @Column({ type: "varchar", length: 255, nullable: true }) name!: string | null;
  @Column({ name: 'kanban_layout_id', type: 'uuid' }) kanbanLayoutId!: string;
  @Column({ name: 'card_layout_id', type: 'uuid' }) cardLayoutId!: string;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}

@Entity('project_items')
export class ProjectItemEntity {
  @PrimaryColumn({ name: 'project_id', type: 'uuid' }) projectId!: string;
  @PrimaryColumn({ type: 'uuid' }) id!: string;
  @Column({ name: 'board_id', type: 'uuid' }) boardId!: string;
  @Column({ name: 'parent_item_id', type: 'uuid', nullable: true }) parentItemId!: string | null;
  @Column({ name: 'instance_level', type: 'smallint' }) instanceLevel!: 1 | 2 | 3;
  @Column({ name: 'column_id', type: 'uuid' }) columnId!: string;
  @Column({ name: 'card_layout_id', type: 'uuid' }) cardLayoutId!: string;
  @Column({ type: 'numeric', precision: 30, scale: 10, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) position!: number;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) data!: JsonObject;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}

@Entity('actions')
export class ActionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'project_id', type: 'uuid', nullable: true }) projectId!: string | null;
  @Column({ name: 'user_id', type: 'uuid', nullable: true }) userId!: string | null;
  @Column({ name: 'entity_type', length: 50 }) entityType!: string;
  @Column({ name: 'entity_id', type: 'uuid', nullable: true }) entityId!: string | null;
  @Column({ name: 'action_type', length: 50 }) actionType!: string;
  @Column({ name: 'before_data', type: 'jsonb', nullable: true }) beforeData!: JsonObject | null;
  @Column({ name: 'after_data', type: 'jsonb', nullable: true }) afterData!: JsonObject | null;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) metadata!: JsonObject;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'project_id', type: 'uuid', nullable: true }) projectId!: string | null;
  @Column({ name: 'uploaded_by', type: 'uuid' }) uploadedBy!: string;
  @Column({ name: 'original_name', type: 'text' }) originalName!: string;
  @Column({ name: 'mime_type', length: 150 }) mimeType!: string;
  @Column({ name: 'size_bytes', type: 'bigint', transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) sizeBytes!: number;
  @Column({ name: 'storage_key', type: 'text' }) storageKey!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
}

export const entities = [
  UserEntity, ProjectEntity, ProjectMemberEntity,
  KanbanLayoutEntity, KanbanLayoutColumnEntity,
  CardLayoutEntity, CardLayoutFieldEntity,
  ProjectInstanceEntity, BoardEntity, ProjectItemEntity,
  ActionEntity, FileEntity,
];
