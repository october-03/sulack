import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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
