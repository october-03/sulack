import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { IsUUID } from 'class-validator';
import type { Prisma } from '../generated/prisma/client';

export type DirectConversationSummary = Prisma.DirectConversationGetPayload<{
	include: {
		members: {
			select: {
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
		};
	};
}>;

export class CreateDirectConversationDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@IsUUID()
	userId!: string;
}

export class DirectConversationParticipantDto {
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
		example: 'Working on the auth flow.',
		nullable: true
	})
	@Expose()
	statusMessage!: string | null;

	@ApiProperty()
	@Expose()
	joinedAt!: Date;

	static from(member: DirectConversationSummary['members'][number]) {
		return plainToInstance(
			DirectConversationParticipantDto,
			{
				...member.user,
				joinedAt: member.joinedAt
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class DirectConversationDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@Expose()
	id!: string;

	@ApiProperty()
	@Expose()
	createdAt!: Date;

	@ApiProperty({
		type: DirectConversationParticipantDto,
		isArray: true
	})
	@Expose()
	participants!: DirectConversationParticipantDto[];

	static from(conversation: DirectConversationSummary) {
		return plainToInstance(
			DirectConversationDto,
			{
				id: conversation.id,
				createdAt: conversation.createdAt,
				participants: conversation.members.map((member) => DirectConversationParticipantDto.from(member))
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class DirectConversationResponseDto {
	@ApiProperty({
		type: DirectConversationDto
	})
	@Expose()
	conversation!: DirectConversationDto;

	static from(conversation: DirectConversationSummary) {
		return plainToInstance(
			DirectConversationResponseDto,
			{
				conversation: DirectConversationDto.from(conversation)
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class DirectConversationListResponseDto {
	@ApiProperty({
		type: DirectConversationDto,
		isArray: true
	})
	@Expose()
	conversations!: DirectConversationDto[];

	static from(conversations: DirectConversationSummary[]) {
		return plainToInstance(
			DirectConversationListResponseDto,
			{
				conversations: conversations.map((conversation) => DirectConversationDto.from(conversation))
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}
