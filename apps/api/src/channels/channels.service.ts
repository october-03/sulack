import { Injectable } from '@nestjs/common';
import { ChannelMemberRole, type Prisma } from '../generated/prisma/client';
import type { SupabaseUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateChannelDto } from './channels.dto';

type ChannelWithMembership = Prisma.ChannelGetPayload<{
	include: {
		members: {
			select: {
				role: true;
				joinedAt: true;
			};
		};
	};
}>;

@Injectable()
export class ChannelsService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly profilesService: ProfilesService
	) {}

	async createChannel(user: SupabaseUser, payload: CreateChannelDto): Promise<ChannelWithMembership> {
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
			include: {
				members: {
					where: {
						userId: user.id
					},
					select: {
						role: true,
						joinedAt: true
					}
				}
			}
		});
	}
}
