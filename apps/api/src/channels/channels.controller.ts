import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
	ApiBadRequestResponse,
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
import {
	ChannelMemberListResponseDto,
	ChannelListResponseDto,
	ChannelResponseDto,
	CreateChannelDto,
	InviteToPrivateChannelDto
} from './channels.dto';
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

	@Get(':channelId/members')
	@ApiOperation({ summary: 'List members of a channel visible to the current authenticated user' })
	@ApiOkResponse({ type: ChannelMemberListResponseDto })
	async listChannelMembers(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('channelId', new ParseUUIDPipe()) channelId: string
	) {
		const members = await this.channelsService.listChannelMembers(authUser.user, channelId);
		return ChannelMemberListResponseDto.from(members);
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

	@Post(':channelId/invitations')
	@ApiOperation({ summary: 'Invite a user into a private channel as the current authenticated admin' })
	@ApiOkResponse({ type: ChannelResponseDto })
	@ApiBadRequestResponse({
		description: 'Only private channels support this invitation API.'
	})
	@ApiForbiddenResponse({
		description: 'Only private channel admins can invite users.'
	})
	async inviteToPrivateChannel(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('channelId', new ParseUUIDPipe()) channelId: string,
		@Body() payload: InviteToPrivateChannelDto
	) {
		const channel = await this.channelsService.inviteToPrivateChannel(authUser.user, channelId, payload.userId);
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
