import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
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
import { ListMessagesQueryDto, MessageListResponseDto } from './messages.dto';
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
