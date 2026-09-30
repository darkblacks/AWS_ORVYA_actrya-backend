import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UserEntity } from '../database/entities';
import { AuthUser } from './auth-user';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly db: DataSource) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{headers: Record<string,string|undefined>; user?: AuthUser}>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Token Bearer ausente.');

    try {
      const payload = await this.jwt.verifyAsync<{sub: string; email: string}>(auth.slice(7));
      const user = await this.db.getRepository(UserEntity).findOne({ where: { id: payload.sub, active: true } });
      if (!user) throw new Error('inactive');
      req.user = { id: user.id, email: user.email, name: user.name, userType: user.userType };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}
