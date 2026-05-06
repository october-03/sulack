import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { CreateMessageDto, ListMessagesQueryDto, MessageListResponseDto, MessageResponseDto } from './messages.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
	description: 'Missing, malformed, invalid, or expired bearer token.'
})
@ApiNotFoundResponse({
	description: 'Conversation was not found or the authenticated user is not a participant.'
})
@Controller()
@UseGuards(AuthGuard)
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {}

	@Post('channels/:channelId/messages')
	@ApiOperation({ summary: 'Create a text message in a channel as the current authenticated member' })
	@ApiCreatedResponse({ type: MessageResponseDto })
	@ApiBadRequestResponse({
		description: 'Message content cannot be blank.'
	})
	async createChannelMessage(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('channelId', new ParseUUIDPipe()) channelId: string,
		@Body() payload: CreateMessageDto
	) {
		const message = await this.messagesService.createChannelMessage(authUser.user, channelId, payload);
		return MessageResponseDto.from(message);
	}

	@Get('channels/:channelId/messages')
	@ApiOperation({ summary: 'List messages in a channel for the current authenticated member' })
	@ApiOkResponse({ type: MessageListResponseDto })
	async listChannelMessages(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('channelId', new ParseUUIDPipe()) channelId: string,
		@Query() query: ListMessagesQueryDto
	) {
		const result = await this.messagesService.listChannelMessages(authUser.user, channelId, query);
		return MessageListResponseDto.from(result.messages, result.hasMore);
	}

	@Post('direct-conversations/:conversationId/messages')
	@ApiOperation({ summary: 'Create a text message in a direct conversation as the current authenticated participant' })
	@ApiCreatedResponse({ type: MessageResponseDto })
	@ApiBadRequestResponse({
		description: 'Message content cannot be blank.'
	})
	async createDirectConversationMessage(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('conversationId', new ParseUUIDPipe()) conversationId: string,
		@Body() payload: CreateMessageDto
	) {
		const message = await this.messagesService.createDirectConversationMessage(authUser.user, conversationId, payload);
		return MessageResponseDto.from(message);
	}

	@Get('direct-conversations/:conversationId/messages')
	@ApiOperation({ summary: 'List messages in a direct conversation for the current authenticated participant' })
	@ApiOkResponse({ type: MessageListResponseDto })
	async listDirectConversationMessages(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('conversationId', new ParseUUIDPipe()) conversationId: string,
		@Query() query: ListMessagesQueryDto
	) {
		const result = await this.messagesService.listDirectConversationMessages(authUser.user, conversationId, query);
		return MessageListResponseDto.from(result.messages, result.hasMore);
	}
}
