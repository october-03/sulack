import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { ProfileResponseDto, UpdateMyProfileDto } from './profiles.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
	description: 'Missing, malformed, invalid, or expired bearer token.'
})
@ApiNotFoundResponse({
	description: 'Authenticated user profile was not found.'
})
@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
	constructor(private readonly profilesService: ProfilesService) {}

	@Get('me')
	@ApiOperation({ summary: 'Get the current authenticated profile' })
	@ApiOkResponse({ type: ProfileResponseDto })
	async getMyProfile(@CurrentUser() authUser: AuthenticatedRequestUser) {
		const profile = await this.profilesService.getMyProfile(authUser.user.id);
		return ProfileResponseDto.from(profile);
	}

	@Patch('me')
	@ApiOperation({ summary: 'Update the current authenticated profile' })
	@ApiOkResponse({ type: ProfileResponseDto })
	async updateMyProfile(@CurrentUser() authUser: AuthenticatedRequestUser, @Body() payload: UpdateMyProfileDto) {
		const profile = await this.profilesService.updateMyProfile(authUser.user.id, payload);
		return ProfileResponseDto.from(profile);
	}
}
