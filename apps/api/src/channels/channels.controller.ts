import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { ChannelListResponseDto, ChannelResponseDto, CreateChannelDto } from './channels.dto';
import { ChannelsService } from './channels.service';

@ApiTags('channels')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
	description: 'Missing, malformed, invalid, or expired bearer token.'
})
@ApiNotFoundResponse({
	description: 'Channel was not found or the authenticated user cannot access it.'
})
@Controller('channels')
@UseGuards(AuthGuard)
export class ChannelsController {
	constructor(private readonly channelsService: ChannelsService) {}

	@Get()
	@ApiOperation({ summary: 'List channels visible to the current authenticated user' })
	@ApiOkResponse({ type: ChannelListResponseDto })
	async listChannels(@CurrentUser() authUser: AuthenticatedRequestUser) {
		const channels = await this.channelsService.listChannels(authUser.user);
		return ChannelListResponseDto.from(channels);
	}

	@Get(':channelId')
	@ApiOperation({ summary: 'Get a channel visible to the current authenticated user' })
	@ApiOkResponse({ type: ChannelResponseDto })
	async getChannel(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('channelId', new ParseUUIDPipe()) channelId: string
	) {
		const channel = await this.channelsService.getChannel(authUser.user, channelId);
		return ChannelResponseDto.from(channel);
	}

	@Post(':channelId/join')
	@ApiOperation({ summary: 'Join a public channel as the current authenticated user' })
	@ApiOkResponse({ type: ChannelResponseDto })
	@ApiForbiddenResponse({
		description: 'Private channels cannot be joined without an invitation.'
	})
	async joinPublicChannel(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('channelId', new ParseUUIDPipe()) channelId: string
	) {
		const channel = await this.channelsService.joinPublicChannel(authUser.user, channelId);
		return ChannelResponseDto.from(channel);
	}

	@Post()
	@ApiOperation({ summary: 'Create a new channel' })
	@ApiCreatedResponse({ type: ChannelResponseDto })
	async createChannel(@CurrentUser() authUser: AuthenticatedRequestUser, @Body() payload: CreateChannelDto) {
		const channel = await this.channelsService.createChannel(authUser.user, payload);
		return ChannelResponseDto.from(channel);
	}
}
