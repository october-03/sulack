import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma, Profile } from '../generated/prisma/client';
import type { SupabaseUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { SearchProfilesQueryDto, UpdateMyProfileDto } from './profiles.dto';

@Injectable()
export class ProfilesService {
	constructor(private readonly prismaService: PrismaService) {}

	async getMyProfile(user: SupabaseUser): Promise<Profile> {
		return this.ensureMyProfile(user);
	}

	async updateMyProfile(user: SupabaseUser, payload: UpdateMyProfileDto): Promise<Profile> {
		await this.ensureMyProfile(user);

		const data: Prisma.ProfileUpdateInput = {};

		if (payload.displayName !== undefined) {
			data.displayName = payload.displayName;
		}

		if (payload.avatarUrl !== undefined) {
			data.avatarUrl = payload.avatarUrl;
		}

		if (payload.statusMessage !== undefined) {
			data.statusMessage = payload.statusMessage;
		}

		return this.prismaService.profile.update({
			where: {
				id: user.id
			},
			data
		});
	}

	async searchProfiles(user: SupabaseUser, query: SearchProfilesQueryDto): Promise<Profile[]> {
		await this.ensureMyProfile(user);

		const searchTerm = query.q.trim();
		const limit = Math.min(query.limit ?? 20, 50);

		return this.prismaService.profile.findMany({
			where: {
				id: {
					not: user.id
				},
				isDeleted: false,
				OR: [
					{
						displayName: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					},
					{
						email: {
							contains: searchTerm,
							mode: 'insensitive'
						}
					}
				]
			},
			orderBy: [
				{
					displayName: 'asc'
				},
				{
					email: 'asc'
				}
			],
			take: limit
		});
	}

	async ensureMyProfile(user: SupabaseUser): Promise<Profile> {
		if (!user.email) {
			throw new BadRequestException('Authenticated Supabase user is missing an email address.');
		}

		const profile = await this.prismaService.profile.findUnique({
			where: {
				id: user.id
			}
		});

		const defaultDisplayName = this.buildDefaultDisplayName(user.email);

		if (!profile) {
			return this.prismaService.profile.create({
				data: {
					id: user.id,
					email: user.email,
					displayName: defaultDisplayName
				}
			});
		}

		const needsRepair = profile.isDeleted || profile.email !== user.email || !profile.displayName.trim();

		if (!needsRepair) {
			return profile;
		}

		return this.prismaService.profile.update({
			where: {
				id: user.id
			},
			data: {
				email: user.email,
				displayName: profile.displayName.trim() ? profile.displayName : defaultDisplayName,
				isDeleted: false
			}
		});
	}

	private buildDefaultDisplayName(email: string) {
		return email.split('@')[0] || 'unknown-user';
	}
}
