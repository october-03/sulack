import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
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
