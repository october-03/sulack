import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedRequestUser } from './auth.types';
import { AuthMeResponseDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: AuthMeResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, malformed, invalid, or expired bearer token.',
  })
  getMe(@CurrentUser() authUser: AuthenticatedRequestUser) {
    return AuthMeResponseDto.from(authUser);
  }
}
