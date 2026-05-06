import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType, type Prisma } from '../generated/prisma/client';
import type { SupabaseUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import {
	type CreateMessageDto,
	type ListMessagesQueryDto,
	type MessageListItem,
	type UpdateMessageDto
} from './messages.dto';

const messageListInclude = {
	author: {
		select: {
			id: true,
			email: true,
			displayName: true,
			avatarUrl: true,
			statusMessage: true
		}
	},
	attachments: {
		orderBy: {
			createdAt: 'asc'
		},
		select: {
			id: true,
			storageBucket: true,
			storagePath: true,
			originalName: true,
			mimeType: true,
			sizeBytes: true,
			createdAt: true
		}
	}
} satisfies Prisma.MessageInclude;

export type MessageListResult = {
	messages: MessageListItem[];
	hasMore: boolean;
};

@Injectable()
export class MessagesService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly profilesService: ProfilesService
	) {}

	async deleteMessage(user: SupabaseUser, messageId: string): Promise<MessageListItem> {
		await this.profilesService.ensureMyProfile(user);
		await this.ensureMessageAuthorCanMutate(user.id, messageId, 'delete');

		return this.prismaService.message.update({
			where: {
				id: messageId
			},
			data: {
				deletedAt: new Date()
			},
			include: messageListInclude
		});
	}

	async updateMessage(user: SupabaseUser, messageId: string, payload: UpdateMessageDto): Promise<MessageListItem> {
		await this.profilesService.ensureMyProfile(user);
		await this.ensureMessageAuthorCanMutate(user.id, messageId, 'update');

		const content = this.normalizeContent(payload.content);

		return this.prismaService.message.update({
			where: {
				id: messageId
			},
			data: {
				content
			},
			include: messageListInclude
		});
	}

	async createChannelMessage(
		user: SupabaseUser,
		channelId: string,
		payload: CreateMessageDto
	): Promise<MessageListItem> {
		await this.profilesService.ensureMyProfile(user);
		await this.ensureChannelMembership(user.id, channelId);

		return this.createMessage(user.id, { channelId }, payload);
	}

	async listChannelMessages(
		user: SupabaseUser,
		channelId: string,
		query: ListMessagesQueryDto
	): Promise<MessageListResult> {
		await this.profilesService.ensureMyProfile(user);
		await this.ensureChannelMembership(user.id, channelId);

		return this.listMessages({ channelId }, query);
	}

	async createDirectConversationMessage(
		user: SupabaseUser,
		conversationId: string,
		payload: CreateMessageDto
	): Promise<MessageListItem> {
		await this.profilesService.ensureMyProfile(user);
		await this.ensureDirectConversationMembership(user.id, conversationId);

		return this.createMessage(user.id, { conversationId }, payload);
	}

	async listDirectConversationMessages(
		user: SupabaseUser,
		conversationId: string,
		query: ListMessagesQueryDto
	): Promise<MessageListResult> {
		await this.profilesService.ensureMyProfile(user);
		await this.ensureDirectConversationMembership(user.id, conversationId);

		return this.listMessages({ conversationId }, query);
	}

	private async createMessage(
		authorId: string,
		target: Pick<Prisma.MessageUncheckedCreateInput, 'channelId' | 'conversationId'>,
		payload: CreateMessageDto
	): Promise<MessageListItem> {
		const content = this.normalizeContent(payload.content);

		return this.prismaService.message.create({
			data: {
				...target,
				authorId,
				content,
				messageType: MessageType.text
			},
			include: messageListInclude
		});
	}

	private normalizeContent(content: string) {
		const normalizedContent = content.trim();

		if (!normalizedContent) {
			throw new BadRequestException('Message content cannot be blank.');
		}

		return normalizedContent;
	}

	private async ensureMessageAuthorCanMutate(authorId: string, messageId: string, action: 'delete' | 'update') {
		const message = await this.prismaService.message.findUnique({
			where: {
				id: messageId
			},
			select: {
				id: true,
				authorId: true,
				deletedAt: true
			}
		});

		if (!message) {
			throw new NotFoundException('Message not found.');
		}

		if (message.authorId !== authorId) {
			throw new ForbiddenException(`Only the message author can ${action} the message.`);
		}

		if (message.deletedAt) {
			throw new BadRequestException(`Deleted messages cannot be ${action === 'update' ? 'edited' : 'deleted again'}.`);
		}
	}

	private async listMessages(
		target: Pick<Prisma.MessageWhereInput, 'channelId' | 'conversationId'>,
		query: ListMessagesQueryDto
	): Promise<MessageListResult> {
		const limit = query.limit ?? 50;
		const messages = await this.prismaService.message.findMany({
			where: {
				...target,
				createdAt: query.before
					? {
							lt: new Date(query.before)
						}
					: undefined
			},
			orderBy: [
				{
					createdAt: 'desc'
				},
				{
					id: 'desc'
				}
			],
			take: limit + 1,
			include: messageListInclude
		});

		const hasMore = messages.length > limit;
		const page = messages.slice(0, limit).reverse();

		return {
			messages: page,
			hasMore
		};
	}

	private async ensureChannelMembership(userId: string, channelId: string) {
		const channel = await this.prismaService.channel.findFirst({
			where: {
				id: channelId,
				members: {
					some: {
						userId
					}
				}
			},
			select: {
				id: true
			}
		});

		if (!channel) {
			throw new NotFoundException('Channel not found or inaccessible.');
		}
	}

	private async ensureDirectConversationMembership(userId: string, conversationId: string) {
		const conversation = await this.prismaService.directConversation.findFirst({
			where: {
				id: conversationId,
				members: {
					some: {
						userId
					}
				}
			},
			select: {
				id: true
			}
		});

		if (!conversation) {
			throw new NotFoundException('Direct conversation not found or inaccessible.');
		}
	}
}
