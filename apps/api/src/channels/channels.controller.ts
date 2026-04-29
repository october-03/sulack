import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { ChannelResponseDto, CreateChannelDto } from './channels.dto';
import { ChannelsService } from './channels.service';

@ApiTags('channels')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
	description: 'Missing, malformed, invalid, or expired bearer token.'
})
@Controller('channels')
@UseGuards(AuthGuard)
export class ChannelsController {
	constructor(private readonly channelsService: ChannelsService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new channel' })
	@ApiCreatedResponse({ type: ChannelResponseDto })
	async createChannel(@CurrentUser() authUser: AuthenticatedRequestUser, @Body() payload: CreateChannelDto) {
		const channel = await this.channelsService.createChannel(authUser.user, payload);
		return ChannelResponseDto.from(channel);
	}
}
