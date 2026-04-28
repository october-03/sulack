import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthenticatedRequestUser } from './auth.types';

type RequestWithAuthUser = {
  headers: {
    authorization?: string;
  };
  authUser?: AuthenticatedRequestUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const accessToken = this.extractBearerToken(request);
    const user = await this.authService.verifyAccessToken(accessToken);

    request.authUser = {
      accessToken,
      user,
    };

    return true;
  }

  private extractBearerToken(request: RequestWithAuthUser): string {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required.');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization header must be a Bearer token.');
    }

    return token;
  }
}
