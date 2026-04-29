import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ChannelMemberRole, ChannelVisibility, type Prisma } from '../generated/prisma/client';

export type ChannelSummary = Prisma.ChannelGetPayload<{
	include: {
		members: {
			select: {
				role: true;
				joinedAt: true;
			};
		};
		_count: {
			select: {
				members: true;
			};
		};
	};
}>;

export class CreateChannelDto {
	@ApiProperty({
		example: 'general'
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	name!: string;

	@ApiPropertyOptional({
		example: '팀 전체 공지와 논의를 위한 기본 채널입니다.',
		nullable: true
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string | null;

	@ApiProperty({
		enum: ChannelVisibility,
		example: ChannelVisibility.public
	})
	@IsEnum(ChannelVisibility)
	visibility!: ChannelVisibility;
}

export class InviteToPrivateChannelDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@IsUUID()
	userId!: string;
}

export class ChannelMembershipDto {
	@ApiProperty({
		enum: ChannelMemberRole,
		example: ChannelMemberRole.admin
	})
	@Expose()
	role!: ChannelMemberRole;

	@ApiProperty()
	@Expose()
	joinedAt!: Date;

	static from(member: ChannelSummary['members'][number]) {
		return plainToInstance(ChannelMembershipDto, member, {
			excludeExtraneousValues: true
		});
	}
}

export class ChannelDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@Expose()
	id!: string;

	@ApiProperty({
		example: 'general'
	})
	@Expose()
	name!: string;

	@ApiPropertyOptional({
		example: '팀 전체 공지와 논의를 위한 기본 채널입니다.',
		nullable: true
	})
	@Expose()
	description!: string | null;

	@ApiProperty({
		enum: ChannelVisibility,
		example: ChannelVisibility.public
	})
	@Expose()
	visibility!: ChannelVisibility;

	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@Expose()
	createdById!: string;

	@ApiProperty()
	@Expose()
	createdAt!: Date;

	@ApiProperty()
	@Expose()
	updatedAt!: Date;

	@ApiProperty({
		example: 12
	})
	@Expose()
	memberCount!: number;

	@ApiPropertyOptional({
		type: ChannelMembershipDto
	})
	@Expose()
	membership!: ChannelMembershipDto | null;

	static from(channel: ChannelSummary) {
		const [membership] = channel.members;

		return plainToInstance(
			ChannelDto,
			{
				...channel,
				memberCount: channel._count.members,
				membership: membership ? ChannelMembershipDto.from(membership) : null
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class ChannelResponseDto {
	@ApiProperty({
		type: ChannelDto
	})
	@Expose()
	channel!: ChannelDto;

	static from(channel: ChannelSummary) {
		return plainToInstance(
			ChannelResponseDto,
			{
				channel: ChannelDto.from(channel)
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class ChannelListResponseDto {
	@ApiProperty({
		type: ChannelDto,
		isArray: true
	})
	@Expose()
	channels!: ChannelDto[];

	static from(channels: ChannelSummary[]) {
		return plainToInstance(
			ChannelListResponseDto,
			{
				channels: channels.map((channel) => ChannelDto.from(channel))
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export type ChannelMemberListItem = Prisma.ChannelMemberGetPayload<{
	select: {
		role: true;
		joinedAt: true;
		user: {
			select: {
				id: true;
				email: true;
				displayName: true;
				avatarUrl: true;
				statusMessage: true;
			};
		};
	};
}>;

export class ChannelMemberProfileDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@Expose()
	id!: string;

	@ApiProperty({
		example: 'alice@sulack.local'
	})
	@Expose()
	email!: string;

	@ApiProperty({
		example: 'Alice'
	})
	@Expose()
	displayName!: string;

	@ApiPropertyOptional({
		example: 'https://example.com/alice.png',
		nullable: true
	})
	@Expose()
	avatarUrl!: string | null;

	@ApiPropertyOptional({
		example: 'Working on the channels API.',
		nullable: true
	})
	@Expose()
	statusMessage!: string | null;

	static from(member: ChannelMemberListItem) {
		return plainToInstance(ChannelMemberProfileDto, member.user, {
			excludeExtraneousValues: true
		});
	}
}

export class ChannelMemberDto {
	@ApiProperty({
		type: ChannelMemberProfileDto
	})
	@Expose()
	user!: ChannelMemberProfileDto;

	@ApiProperty({
		enum: ChannelMemberRole,
		example: ChannelMemberRole.member
	})
	@Expose()
	role!: ChannelMemberRole;

	@ApiProperty()
	@Expose()
	joinedAt!: Date;

	static from(member: ChannelMemberListItem) {
		return plainToInstance(
			ChannelMemberDto,
			{
				user: ChannelMemberProfileDto.from(member),
				role: member.role,
				joinedAt: member.joinedAt
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class ChannelMemberListResponseDto {
	@ApiProperty({
		type: ChannelMemberDto,
		isArray: true
	})
	@Expose()
	members!: ChannelMemberDto[];

	static from(members: ChannelMemberListItem[]) {
		return plainToInstance(
			ChannelMemberListResponseDto,
			{
				members: members.map((member) => ChannelMemberDto.from(member))
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}
