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
	description: 'Channel was not found or the authenticated user is not a member.'
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
}
