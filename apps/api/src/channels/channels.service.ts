import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChannelMemberRole, ChannelVisibility, type Prisma } from '../generated/prisma/client';
import type { SupabaseUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { type ChannelSummary, CreateChannelDto } from './channels.dto';

const channelSummaryInclude = {
	members: {
		select: {
			role: true,
			joinedAt: true
		}
	},
	_count: {
		select: {
			members: true
		}
	}
} satisfies Prisma.ChannelInclude;

const buildChannelSummaryInclude = (userId: string) =>
	({
		...channelSummaryInclude,
		members: {
			where: {
				userId
			},
			select: {
				role: true,
				joinedAt: true
			}
		}
	}) satisfies Prisma.ChannelInclude;

@Injectable()
export class ChannelsService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly profilesService: ProfilesService
	) {}

	async createChannel(user: SupabaseUser, payload: CreateChannelDto): Promise<ChannelSummary> {
		await this.profilesService.ensureMyProfile(user);

		const trimmedName = payload.name.trim();
		const trimmedDescription = payload.description?.trim();

		return this.prismaService.channel.create({
			data: {
				name: trimmedName,
				description: trimmedDescription ? trimmedDescription : null,
				visibility: payload.visibility,
				createdById: user.id,
				members: {
					create: {
						userId: user.id,
						role: ChannelMemberRole.admin
					}
				}
			},
			include: buildChannelSummaryInclude(user.id)
		});
	}

	async listChannels(user: SupabaseUser): Promise<ChannelSummary[]> {
		await this.profilesService.ensureMyProfile(user);

		return this.prismaService.channel.findMany({
			where: {
				OR: [
					{
						visibility: ChannelVisibility.public
					},
					{
						members: {
							some: {
								userId: user.id
							}
						}
					}
				]
			},
			orderBy: [
				{
					createdAt: 'asc'
				}
			],
			include: buildChannelSummaryInclude(user.id)
		});
	}

	async getChannel(user: SupabaseUser, channelId: string): Promise<ChannelSummary> {
		await this.profilesService.ensureMyProfile(user);

		const channel = await this.prismaService.channel.findFirst({
			where: {
				id: channelId,
				OR: [
					{
						visibility: ChannelVisibility.public
					},
					{
						members: {
							some: {
								userId: user.id
							}
						}
					}
				]
			},
			include: buildChannelSummaryInclude(user.id)
		});

		if (!channel) {
			throw new NotFoundException('Channel not found or inaccessible.');
		}

		return channel;
	}

	async joinPublicChannel(user: SupabaseUser, channelId: string): Promise<ChannelSummary> {
		await this.profilesService.ensureMyProfile(user);

		return this.prismaService.$transaction(async (tx) => {
			const channel = await tx.channel.findUnique({
				where: {
					id: channelId
				},
				select: {
					id: true,
					visibility: true
				}
			});

			if (!channel) {
				throw new NotFoundException('Channel not found.');
			}

			if (channel.visibility !== ChannelVisibility.public) {
				throw new ForbiddenException('Private channels require an invitation.');
			}

			await tx.channelMember.upsert({
				where: {
					channelId_userId: {
						channelId,
						userId: user.id
					}
				},
				create: {
					channelId,
					userId: user.id,
					role: ChannelMemberRole.member
				},
				update: {}
			});

			return tx.channel.findUniqueOrThrow({
				where: {
					id: channelId
				},
				include: buildChannelSummaryInclude(user.id)
			});
		});
	}

	async inviteToPrivateChannel(user: SupabaseUser, channelId: string, invitedUserId: string): Promise<ChannelSummary> {
		await this.profilesService.ensureMyProfile(user);

		return this.prismaService.$transaction(async (tx) => {
			const channel = await tx.channel.findUnique({
				where: {
					id: channelId
				},
				select: {
					id: true,
					visibility: true,
					members: {
						where: {
							userId: user.id
						},
						select: {
							role: true
						}
					}
				}
			});

			if (!channel || channel.members.length === 0) {
				throw new NotFoundException('Channel not found or inaccessible.');
			}

			if (channel.visibility !== ChannelVisibility.private) {
				throw new BadRequestException('Only private channels support invitations.');
			}

			const [requesterMembership] = channel.members;

			if (requesterMembership.role !== ChannelMemberRole.admin) {
				throw new ForbiddenException('Only private channel admins can invite members.');
			}

			const invitedProfile = await tx.profile.findFirst({
				where: {
					id: invitedUserId,
					isDeleted: false
				},
				select: {
					id: true
				}
			});

			if (!invitedProfile) {
				throw new NotFoundException('Invited profile not found.');
			}

			await tx.channelMember.upsert({
				where: {
					channelId_userId: {
						channelId,
						userId: invitedUserId
					}
				},
				create: {
					channelId,
					userId: invitedUserId,
					role: ChannelMemberRole.member
				},
				update: {}
			});

			return tx.channel.findUniqueOrThrow({
				where: {
					id: channelId
				},
				include: buildChannelSummaryInclude(user.id)
			});
		});
	}
}
