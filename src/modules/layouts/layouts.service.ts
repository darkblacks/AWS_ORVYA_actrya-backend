import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; import { DataSource, Repository } from 'typeorm';
import { CardLayoutEntity, CardLayoutFieldEntity, KanbanLayoutColumnEntity, KanbanLayoutEntity } from '../../database/entities';
import { AuditService } from '../audit/audit.service'; import { CreateCardLayoutDto, CreateKanbanLayoutDto } from './layouts.dto';
@Injectable() export class LayoutsService{
 constructor(@InjectRepository(KanbanLayoutEntity)private k:Repository<KanbanLayoutEntity>,@InjectRepository(KanbanLayoutColumnEntity)private kc:Repository<KanbanLayoutColumnEntity>,@InjectRepository(CardLayoutEntity)private c:Repository<CardLayoutEntity>,@InjectRepository(CardLayoutFieldEntity)private cf:Repository<CardLayoutFieldEntity>,private audit:AuditService,private db:DataSource){}
 listKanban(uid:string){return this.k.createQueryBuilder('l').where('l.deleted_at IS NULL').andWhere('(l.is_system=true OR l.created_by=:uid)',{uid}).orderBy('l.is_system','DESC').addOrderBy('l.name','ASC').getMany()}
 async getKanban(id:string,uid:string){const l=await this.k.findOne({where:[{id,isSystem:true},{id,createdBy:uid}]});if(!l)throw new NotFoundException();return {...l,columns:await this.kc.find({where:{kanbanLayoutId:id},order:{position:'ASC'}})}}
 async createKanban(uid:string,d:CreateKanbanLayoutDto){if(!d.columns.some(c=>c.isInitial))d.columns[0].isInitial=true;if(d.columns.filter(c=>c.isInitial).length>1)throw new BadRequestException('Defina apenas uma coluna inicial.');const l=await this.k.save(this.k.create({name:d.name,createdBy:uid,isSystem:false}));const cols=await this.kc.save(d.columns.map(x=>this.kc.create({kanbanLayoutId:l.id,name:x.name,position:x.position,isInitial:x.isInitial??false,isFinal:x.isFinal??false,config:x.config??{}})));await this.audit.log({userId:uid,entityType:'KANBAN_LAYOUT',entityId:l.id,actionType:'CREATE',after:{name:l.name,columns:cols}});return {...l,columns:cols}}
 async replaceKanban(uid:string,id:string,d:CreateKanbanLayoutDto){
  const existing=await this.k.findOne({where:{id}});if(!existing)throw new NotFoundException();if(existing.isSystem||existing.createdBy!==uid)throw new ForbiddenException();
  if(!d.columns.some(c=>c.isInitial))d.columns[0].isInitial=true;if(d.columns.filter(c=>c.isInitial).length>1)throw new BadRequestException('Defina apenas uma coluna inicial.');
  const before=await this.getKanban(id,uid);
  const result=await this.db.transaction(async tx=>{
    const layouts=tx.getRepository(KanbanLayoutEntity);const columns=tx.getRepository(KanbanLayoutColumnEntity);
    const layout=await layouts.findOneByOrFail({id});layout.name=d.name;await layouts.save(layout);
    const current=await columns.find({where:{kanbanLayoutId:id}});const currentById=new Map<string,KanbanLayoutColumnEntity>(current.map(c=>[c.id,c] as [string,KanbanLayoutColumnEntity]));
    if(current.length)await columns.createQueryBuilder().update().set({position:()=>"position + 10000"}).where('kanban_layout_id = :id',{id}).execute();
    const keep=new Set<string>();const saved:KanbanLayoutColumnEntity[]=[];
    for(const x of d.columns){
      let col=x.id?currentById.get(x.id):undefined;
      if(x.id&&!col)throw new BadRequestException('Uma coluna informada não pertence a este layout.');
      col=col??columns.create({kanbanLayoutId:id});Object.assign(col,{name:x.name,position:x.position,isInitial:x.isInitial??false,isFinal:x.isFinal??false,config:x.config??{}});
      const row=await columns.save(col);keep.add(row.id);saved.push(row);
    }
    const removed=current.filter(c=>!keep.has(c.id));
    if(removed.length){
      const countRows=await tx.query(`SELECT count(*)::int AS count FROM project_items WHERE column_id = ANY($1::uuid[]) AND deleted_at IS NULL`,[removed.map(c=>c.id)]) as Array<{count:number}>;
      if(Number(countRows[0]?.count??0)>0)throw new BadRequestException('Há cards em uma coluna que você tentou excluir. Mova os cards antes de remover a coluna.');
      await columns.delete(removed.map(c=>c.id));
    }
    return {...layout,columns:saved.sort((a,b)=>a.position-b.position)};
  });
  await this.audit.log({userId:uid,entityType:'KANBAN_LAYOUT',entityId:id,actionType:'UPDATE',before:before as any,after:result as any});return result;
 }
 listCard(uid:string){return this.c.createQueryBuilder('l').where('l.deleted_at IS NULL').andWhere('(l.is_system=true OR l.created_by=:uid)',{uid}).orderBy('l.is_system','DESC').addOrderBy('l.name','ASC').getMany()}
 async getCard(id:string,uid:string){const l=await this.c.findOne({where:[{id,isSystem:true},{id,createdBy:uid}]});if(!l)throw new NotFoundException();return {...l,fields:await this.cf.find({where:{cardLayoutId:id},order:{position:'ASC'}})}}
 async createCard(uid:string,d:CreateCardLayoutDto){const l=await this.c.save(this.c.create({name:d.name,createdBy:uid,isSystem:false}));const fields=await this.cf.save(d.fields.map(x=>this.cf.create({cardLayoutId:l.id,fieldKey:x.fieldKey,label:x.label,fieldType:x.fieldType,position:x.position,required:x.required??false,showInKanban:x.showInKanban??true,config:x.config??{}})));await this.audit.log({userId:uid,entityType:'CARD_LAYOUT',entityId:l.id,actionType:'CREATE',after:{name:l.name,fields}});return {...l,fields}}
 async replaceCard(uid:string,id:string,d:CreateCardLayoutDto){
  const l=await this.c.findOne({where:{id}});if(!l)throw new NotFoundException();if(l.isSystem||l.createdBy!==uid)throw new ForbiddenException();const before=await this.getCard(id,uid);l.name=d.name;await this.c.save(l);
  const current=await this.cf.find({where:{cardLayoutId:id}});const byId=new Map<string,CardLayoutFieldEntity>(current.map(f=>[f.id,f] as [string,CardLayoutFieldEntity]));const keep=new Set<string>();const fields:CardLayoutFieldEntity[]=[];
  if(current.length)await this.cf.createQueryBuilder().update().set({position:()=>"position + 10000"}).where('card_layout_id = :id',{id}).execute();
  for(const x of d.fields){let f=x.id?byId.get(x.id):undefined;if(x.id&&!f)throw new BadRequestException('Um campo informado não pertence a este Card Layout.');if(f&&f.fieldKey!==x.fieldKey)throw new BadRequestException('fieldKey é a chave interna e não pode ser renomeada após criada; altere apenas o label ou crie um novo campo.');f=f??this.cf.create({cardLayoutId:id});Object.assign(f,{fieldKey:x.fieldKey,label:x.label,fieldType:x.fieldType,position:x.position,required:x.required??false,showInKanban:x.showInKanban??true,config:x.config??{}});const row=await this.cf.save(f);keep.add(row.id);fields.push(row)}
  const removed=current.filter(f=>!keep.has(f.id));if(removed.length)await this.cf.delete(removed.map(f=>f.id));
  const result={...l,fields:fields.sort((a,b)=>a.position-b.position)};await this.audit.log({userId:uid,entityType:'CARD_LAYOUT',entityId:id,actionType:'UPDATE',before:before as any,after:result as any});return result;
 }
}
