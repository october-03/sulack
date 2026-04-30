import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { SupabaseUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import {
	type DirectConversationSummary,
	CreateDirectConversationDto
} from './direct-conversations.dto';

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

		if (payload.userId === user.id) {
			throw new BadRequestException('You cannot create a direct conversation with yourself.');
		}

		return this.prismaService.$transaction(async (tx) => {
			const targetProfile = await tx.profile.findFirst({
				where: {
					id: payload.userId,
					isDeleted: false
				},
				select: {
					id: true
				}
			});

			if (!targetProfile) {
				throw new NotFoundException('Target profile not found.');
			}

			const participantIds = [user.id, payload.userId];
			const existingConversationIds = await tx.$queryRaw<Array<{ conversationId: string }>>(Prisma.sql`
				SELECT dcm.conversation_id AS "conversationId"
				FROM public.direct_conversation_members AS dcm
				GROUP BY dcm.conversation_id
				HAVING COUNT(*) = 2
					AND COUNT(*) FILTER (WHERE dcm.user_id IN (${Prisma.join(participantIds)})) = 2
			`);

			const existingConversationId = existingConversationIds[0]?.conversationId;

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
						create: participantIds.map((participantId) => ({
							userId: participantId
						}))
					}
				},
				include: directConversationInclude
			});
		});
	}
}
