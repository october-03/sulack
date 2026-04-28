import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedRequestUser } from './auth.types';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() authUser: AuthenticatedRequestUser) {
    return {
      user: authUser.user,
    };
  }
}
