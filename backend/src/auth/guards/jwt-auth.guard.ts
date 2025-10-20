import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    this.logger.log(`JwtAuthGuard: isPublic = ${isPublic}`);
    
    if (isPublic) {
      return true;
    }

     // For debugging - temporarily allow all requests
    // this.logger.log('JwtAuthGuard: Temporarily allowing all requests for debugging');
    // return true;
    
    // return super.canActivate(context);
    
    return super.canActivate(context);
  }
}