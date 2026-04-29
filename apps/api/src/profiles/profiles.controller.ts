import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
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
import {
	ProfileResponseDto,
	SearchProfilesQueryDto,
	SearchProfilesResponseDto,
	UpdateMyProfileDto
} from './profiles.dto';
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

	@Get('search')
	@ApiOperation({ summary: 'Search other active user profiles for DM or invitation flows' })
	@ApiOkResponse({ type: SearchProfilesResponseDto })
	async searchProfiles(@CurrentUser() authUser: AuthenticatedRequestUser, @Query() query: SearchProfilesQueryDto) {
		const profiles = await this.profilesService.searchProfiles(authUser.user, query);
		return SearchProfilesResponseDto.from(profiles);
	}

	@Get('me')
	@ApiOperation({ summary: 'Get the current authenticated profile' })
	@ApiOkResponse({ type: ProfileResponseDto })
	async getMyProfile(@CurrentUser() authUser: AuthenticatedRequestUser) {
		const profile = await this.profilesService.getMyProfile(authUser.user);
		return ProfileResponseDto.from(profile);
	}

	@Patch('me')
	@ApiOperation({ summary: 'Update the current authenticated profile' })
	@ApiOkResponse({ type: ProfileResponseDto })
	async updateMyProfile(@CurrentUser() authUser: AuthenticatedRequestUser, @Body() payload: UpdateMyProfileDto) {
		const profile = await this.profilesService.updateMyProfile(authUser.user, payload);
		return ProfileResponseDto.from(profile);
	}
}
