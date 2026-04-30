import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { SupabaseUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { type DirectConversationSummary, CreateDirectConversationDto } from './direct-conversations.dto';

const directConversationInclude = {
	members: {
		orderBy: {
			joinedAt: 'asc'
		},
		select: {
			joinedAt: true,
			user: {
				select: {
					id: true,
					email: true,
					displayName: true,
					avatarUrl: true,
					statusMessage: true
				}
			}
		}
	}
} satisfies Prisma.DirectConversationInclude;

@Injectable()
export class DirectConversationsService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly profilesService: ProfilesService
	) {}

	async createDirectConversation(
		user: SupabaseUser,
		payload: CreateDirectConversationDto
	): Promise<DirectConversationSummary> {
		await this.profilesService.ensureMyProfile(user);
		this.assertOtherParticipant(user.id, payload.userId);

		return this.prismaService.$transaction(async (tx) => {
			await this.ensureActiveTargetProfile(tx, payload.userId);

			const existingConversationId = await this.findExistingConversationId(tx, [user.id, payload.userId]);

			if (existingConversationId) {
				return tx.directConversation.findUniqueOrThrow({
					where: {
						id: existingConversationId
					},
					include: directConversationInclude
				});
			}

			return tx.directConversation.create({
				data: {
					members: {
						create: [user.id, payload.userId].map((participantId) => ({
							userId: participantId
						}))
					}
				},
				include: directConversationInclude
			});
		});
	}

	async getDirectConversationWithUser(user: SupabaseUser, targetUserId: string): Promise<DirectConversationSummary> {
		await this.profilesService.ensureMyProfile(user);
		this.assertOtherParticipant(user.id, targetUserId);

		return this.prismaService.$transaction(async (tx) => {
			await this.ensureActiveTargetProfile(tx, targetUserId);

			const existingConversationId = await this.findExistingConversationId(tx, [user.id, targetUserId]);

			if (!existingConversationId) {
				throw new NotFoundException('Direct conversation not found.');
			}

			return tx.directConversation.findUniqueOrThrow({
				where: {
					id: existingConversationId
				},
				include: directConversationInclude
			});
		});
	}

	private assertOtherParticipant(currentUserId: string, targetUserId: string) {
		if (currentUserId === targetUserId) {
			throw new BadRequestException('You cannot use yourself as the other direct conversation participant.');
		}
	}

	private async ensureActiveTargetProfile(tx: Prisma.TransactionClient, targetUserId: string) {
		const targetProfile = await tx.profile.findFirst({
			where: {
				id: targetUserId,
				isDeleted: false
			},
			select: {
				id: true
			}
		});

		if (!targetProfile) {
			throw new NotFoundException('Target profile not found.');
		}
	}

	private async findExistingConversationId(tx: Prisma.TransactionClient, participantIds: string[]) {
		const existingConversationIds = await tx.$queryRaw<Array<{ conversationId: string }>>(Prisma.sql`
			SELECT dcm.conversation_id AS "conversationId"
			FROM public.direct_conversation_members AS dcm
			GROUP BY dcm.conversation_id
			HAVING COUNT(*) = 2
				AND COUNT(*) FILTER (WHERE dcm.user_id IN (${Prisma.join(participantIds)})) = 2
		`);

		return existingConversationIds[0]?.conversationId ?? null;
	}
}
