import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequestUser } from './auth.types';

type RequestWithAuthUser = {
	authUser?: AuthenticatedRequestUser;
};

export const CurrentUser = createParamDecorator(
	(_data: unknown, context: ExecutionContext): AuthenticatedRequestUser => {
		const request = context.switchToHttp().getRequest<RequestWithAuthUser>();

		if (!request.authUser) {
			throw new UnauthorizedException('Authenticated user is not available on the request.');
		}

		return request.authUser;
	}
);
