import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UnAuthorizedException } from '../../shared';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, isAuthenticated, info) {
    if (err || !isAuthenticated) {
      if (info && info.message) {
        if (info.message === 'No auth token') {
          throw new UnAuthorizedException('MISSING_AUTH_TOKEN');
        } else if (info.message === 'invalid signature') {
          throw new UnAuthorizedException('INVALID_TOKEN');
        } else if (info.message === 'jwt expired') {
          throw new UnAuthorizedException('EXPIRED_TOKEN');
        }
      }

      throw new UnAuthorizedException('UNAUTHORIZED');
    }
    return isAuthenticated;
  }
}
