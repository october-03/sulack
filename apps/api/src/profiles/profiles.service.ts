import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, Profile } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMyProfileDto } from './profiles.dto';

@Injectable()
export class ProfilesService {
	constructor(private readonly prismaService: PrismaService) {}

	async getMyProfile(userId: string): Promise<Profile> {
		const profile = await this.prismaService.profile.findFirst({
			where: {
				id: userId,
				isDeleted: false
			}
		});

		if (!profile) {
			throw new NotFoundException('Profile not found for the authenticated user.');
		}

		return profile;
	}

	async updateMyProfile(userId: string, payload: UpdateMyProfileDto): Promise<Profile> {
		await this.ensureProfileExists(userId);

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
				id: userId
			},
			data
		});
	}

	private async ensureProfileExists(userId: string) {
		const profile = await this.prismaService.profile.findFirst({
			where: {
				id: userId,
				isDeleted: false
			},
			select: {
				id: true
			}
		});

		if (!profile) {
			throw new NotFoundException('Profile not found for the authenticated user.');
		}
	}
}
