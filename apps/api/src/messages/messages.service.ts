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

		const limit = query.limit ?? 50;
		const messages = await this.prismaService.message.findMany({
			where: {
				channelId,
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
}
