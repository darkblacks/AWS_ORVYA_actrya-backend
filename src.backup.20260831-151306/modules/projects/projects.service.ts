import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { BoardEntity, ProjectEntity, ProjectInstanceEntity, ProjectMemberEntity } from '../../database/entities';
import { AuditService } from '../audit/audit.service';
import { ProjectAccessService } from '../../common/project-access.service';
import { AddMemberDto, CreateProjectDto, UpdateInstanceDto, UpdateProjectDto } from './projects.dto';

const DEFAULT_KANBAN='00000000-0000-4000-8000-000000000001';
const DEFAULT_CARD='00000000-0000-4000-8000-000000000002';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity) private projects:Repository<ProjectEntity>,
    @InjectRepository(ProjectMemberEntity) private members:Repository<ProjectMemberEntity>,
    @InjectRepository(ProjectInstanceEntity) private instances:Repository<ProjectInstanceEntity>,
    @InjectRepository(BoardEntity) private boards:Repository<BoardEntity>,
    private db:DataSource, private audit:AuditService, private access:ProjectAccessService,
  ){}
  private partitionName(id:string){return `project_items_p_${id.replace(/-/g,'')}`;}
  async create(userId:string,dto:CreateProjectDto){
    const result = await this.db.transaction(async tx=>{
      const project=await tx.getRepository(ProjectEntity).save(tx.getRepository(ProjectEntity).create({name:dto.name,description:dto.description??null,createdBy:userId}));
      await tx.getRepository(ProjectMemberEntity).save({projectId:project.id,userId,role:'owner'});
      const names=['Tarefa','Subtarefa','Atividade'];
      const created:ProjectInstanceEntity[]=[];
      for(let i=1;i<=3;i++) created.push(await tx.getRepository(ProjectInstanceEntity).save(tx.getRepository(ProjectInstanceEntity).create({projectId:project.id,instanceLevel:i as 1|2|3,name:names[i-1],defaultKanbanLayoutId:DEFAULT_KANBAN,defaultCardLayoutId:DEFAULT_CARD,enabled:true})));
      const partition=this.partitionName(project.id);
      await tx.query(`CREATE TABLE IF NOT EXISTS "${partition}" PARTITION OF project_items FOR VALUES IN ('${project.id}')`);
      const root=await tx.getRepository(BoardEntity).save(tx.getRepository(BoardEntity).create({projectId:project.id,projectInstanceId:created[0].id,parentItemId:null,name:project.name,kanbanLayoutId:DEFAULT_KANBAN,cardLayoutId:DEFAULT_CARD,createdBy:userId}));
      return {...project,instances:created,rootBoardId:root.id};
    });
    await this.audit.log({projectId:result.id,userId,entityType:'PROJECT',entityId:result.id,actionType:'CREATE',after:{id:result.id,name:result.name,rootBoardId:result.rootBoardId}});
    return result;
  }
  async list(userId:string){ return this.projects.createQueryBuilder('p').innerJoin('project_members','pm','pm.project_id=p.id AND pm.user_id=:uid',{uid:userId}).where('p.deleted_at IS NULL').orderBy('p.updated_at','DESC').getMany(); }
  async get(projectId:string,userId:string){ await this.access.assertMember(projectId,userId); const project=await this.projects.findOne({where:{id:projectId}}); if(!project) throw new NotFoundException(); const instances=await this.instances.find({where:{projectId},order:{instanceLevel:'ASC'}}); const rootBoard=await this.boards.findOne({where:{projectId,parentItemId:IsNull()}}); return {...project,instances,rootBoardId:rootBoard?.id??null}; }
  async update(projectId:string,userId:string,dto:UpdateProjectDto){await this.access.assertOwner(projectId,userId);const p=await this.projects.findOneByOrFail({id:projectId});const before={...p};Object.assign(p,dto);const saved=await this.projects.save(p);await this.audit.log({projectId,userId,entityType:'PROJECT',entityId:projectId,actionType:'UPDATE',before,after:{...saved}});return saved;}
  async remove(projectId:string,userId:string){await this.access.assertOwner(projectId,userId);const p=await this.projects.findOneByOrFail({id:projectId});await this.projects.softRemove(p);await this.audit.log({projectId,userId,entityType:'PROJECT',entityId:projectId,actionType:'DELETE',before:{...p}});return {ok:true};}
  async updateInstance(projectId:string,level:1|2|3,userId:string,dto:UpdateInstanceDto){
    await this.access.assertOwner(projectId,userId);
    const inst=await this.instances.findOne({where:{projectId,instanceLevel:level}});
    if(!inst)throw new NotFoundException('Instância não encontrada.');
    const before={...inst};
    if(dto.name!==undefined)inst.name=dto.name;
    if(dto.kanbanLayoutId)inst.defaultKanbanLayoutId=dto.kanbanLayoutId;
    if(dto.cardLayoutId)inst.defaultCardLayoutId=dto.cardLayoutId;
    if(dto.enabled!==undefined)inst.enabled=dto.enabled;
    const saved=await this.instances.save(inst);
    if(dto.kanbanLayoutId || dto.cardLayoutId){
      await this.boards.update({projectId,projectInstanceId:inst.id},{kanbanLayoutId:inst.defaultKanbanLayoutId,cardLayoutId:inst.defaultCardLayoutId});
    }
    await this.audit.log({projectId,userId,entityType:'PROJECT_INSTANCE',entityId:inst.id,actionType:'UPDATE',before,after:{...saved}});
    return saved;
  }
  async addMember(projectId:string,userId:string,dto:AddMemberDto){await this.access.assertOwner(projectId,userId);const row=await this.members.save(this.members.create({projectId,userId:dto.userId,role:dto.role}));await this.audit.log({projectId,userId,entityType:'PROJECT_MEMBER',entityId:dto.userId,actionType:'ADD_MEMBER',after:{role:dto.role}});return row;}
}
