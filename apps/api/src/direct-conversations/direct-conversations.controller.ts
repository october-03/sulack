import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBadRequestResponse,
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
	CreateDirectConversationDto,
	DirectConversationListResponseDto,
	DirectConversationResponseDto
} from './direct-conversations.dto';
import { DirectConversationsService } from './direct-conversations.service';

@ApiTags('direct-conversations')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
	description: 'Missing, malformed, invalid, or expired bearer token.'
})
@Controller('direct-conversations')
@UseGuards(AuthGuard)
export class DirectConversationsController {
	constructor(private readonly directConversationsService: DirectConversationsService) {}

	@Get()
	@ApiOperation({ summary: 'List direct conversations for the current authenticated user' })
	@ApiOkResponse({ type: DirectConversationListResponseDto })
	async listDirectConversations(@CurrentUser() authUser: AuthenticatedRequestUser) {
		const conversations = await this.directConversationsService.listDirectConversations(authUser.user);
		return DirectConversationListResponseDto.from(conversations);
	}

	@Get('with/:userId')
	@ApiOperation({ summary: 'Get an existing 1:1 direct conversation with another active user' })
	@ApiOkResponse({ type: DirectConversationResponseDto })
	@ApiBadRequestResponse({
		description: 'You cannot look up a direct conversation with yourself.'
	})
	@ApiNotFoundResponse({
		description: 'Target profile or direct conversation was not found.'
	})
	async getDirectConversationWithUser(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Param('userId', new ParseUUIDPipe()) userId: string
	) {
		const conversation = await this.directConversationsService.getDirectConversationWithUser(authUser.user, userId);
		return DirectConversationResponseDto.from(conversation);
	}

	@Post()
	@HttpCode(200)
	@ApiOperation({ summary: 'Create or reuse a 1:1 direct conversation with another active user' })
	@ApiOkResponse({ type: DirectConversationResponseDto })
	@ApiBadRequestResponse({
		description: 'You cannot create a direct conversation with yourself.'
	})
	@ApiNotFoundResponse({
		description: 'Target profile was not found.'
	})
	async createDirectConversation(
		@CurrentUser() authUser: AuthenticatedRequestUser,
		@Body() payload: CreateDirectConversationDto
	) {
		const conversation = await this.directConversationsService.createDirectConversation(authUser.user, payload);
		return DirectConversationResponseDto.from(conversation);
	}
}
