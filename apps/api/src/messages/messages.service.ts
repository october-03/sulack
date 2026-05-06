import { Injectable, NotFoundException } from '@nestjs/common';
import { type Prisma } from '../generated/prisma/client';
import type { SupabaseUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { type ListMessagesQueryDto, type MessageListItem } from './messages.dto';

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

	async listChannelMessages(
		user: SupabaseUser,
		channelId: string,
		query: ListMessagesQueryDto
	): Promise<MessageListResult> {
		await this.profilesService.ensureMyProfile(user);
		await this.ensureChannelMembership(user.id, channelId);

		return this.listMessages({ channelId }, query);
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
