import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UserEntity } from '../../database/entities';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}

  async list(search?: string) {
    const where = search?.trim()
      ? [
          { active: true, name: ILike(`%${search.trim()}%`) },
          { active: true, email: ILike(`%${search.trim()}%`) },
        ]
      : { active: true };

    const rows = await this.users.find({
      where: where as any,
      order: { name: 'ASC' },
      take: 100,
    });

    return rows.map((u) => ({ id: u.id, name: u.name, email: u.email, userType: u.userType }));
  }
}
