import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance, Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MessageType, type Prisma } from '../generated/prisma/client';

export class CreateMessageDto {
	@ApiProperty({
		example: '이번 릴리즈 범위를 공유합니다.'
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(4000)
	content!: string;
}

export class UpdateMessageDto {
	@ApiProperty({
		example: '이번 릴리즈 범위를 조금 더 구체적으로 공유합니다.'
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(4000)
	content!: string;
}

export class ListMessagesQueryDto {
	@ApiPropertyOptional({
		example: 50,
		default: 50,
		description: 'Maximum number of messages to return.'
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number;

	@ApiPropertyOptional({
		example: '2026-04-23T12:00:00.000Z',
		description: 'Return messages created before this timestamp.'
	})
	@IsOptional()
	@IsDateString()
	before?: string;
}

export type MessageListItem = Prisma.MessageGetPayload<{
	include: {
		author: {
			select: {
				id: true;
				email: true;
				displayName: true;
				avatarUrl: true;
				statusMessage: true;
			};
		};
		attachments: {
			select: {
				id: true;
				storageBucket: true;
				storagePath: true;
				originalName: true;
				mimeType: true;
				sizeBytes: true;
				createdAt: true;
			};
		};
	};
}>;

export class MessageAuthorDto {
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
		example: 'Reading channel history.',
		nullable: true
	})
	@Expose()
	statusMessage!: string | null;

	static from(message: MessageListItem) {
		return plainToInstance(MessageAuthorDto, message.author, {
			excludeExtraneousValues: true
		});
	}
}

export class MessageAttachmentDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@Expose()
	id!: string;

	@ApiProperty({
		example: 'message-attachments'
	})
	@Expose()
	storageBucket!: string;

	@ApiProperty({
		example: 'channels/general/sprint-plan.pdf'
	})
	@Expose()
	storagePath!: string;

	@ApiProperty({
		example: 'sprint-plan.pdf'
	})
	@Expose()
	originalName!: string;

	@ApiProperty({
		example: 'application/pdf'
	})
	@Expose()
	mimeType!: string;

	@ApiProperty({
		example: '204800',
		description: 'File size in bytes, serialized as a string to preserve precision.'
	})
	@Expose()
	sizeBytes!: string;

	@ApiProperty()
	@Expose()
	createdAt!: Date;

	static from(attachment: MessageListItem['attachments'][number]) {
		return plainToInstance(
			MessageAttachmentDto,
			{
				...attachment,
				sizeBytes: attachment.sizeBytes.toString()
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class MessageDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@Expose()
	id!: string;

	@ApiPropertyOptional({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab',
		nullable: true
	})
	@Expose()
	channelId!: string | null;

	@ApiPropertyOptional({
		example: null,
		nullable: true
	})
	@Expose()
	conversationId!: string | null;

	@ApiProperty({
		type: MessageAuthorDto
	})
	@Expose()
	author!: MessageAuthorDto;

	@ApiProperty({
		example: '이번 릴리즈 범위를 공유합니다.'
	})
	@Expose()
	content!: string;

	@ApiProperty({
		enum: MessageType,
		example: MessageType.text
	})
	@Expose()
	messageType!: MessageType;

	@ApiProperty()
	@Expose()
	createdAt!: Date;

	@ApiProperty()
	@Expose()
	updatedAt!: Date;

	@ApiPropertyOptional({
		nullable: true
	})
	@Expose()
	deletedAt!: Date | null;

	@ApiProperty({
		type: MessageAttachmentDto,
		isArray: true
	})
	@Expose()
	attachments!: MessageAttachmentDto[];

	static from(message: MessageListItem) {
		return plainToInstance(
			MessageDto,
			{
				...message,
				author: MessageAuthorDto.from(message),
				attachments: message.attachments.map((attachment) => MessageAttachmentDto.from(attachment))
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class MessageListResponseDto {
	@ApiProperty({
		type: MessageDto,
		isArray: true
	})
	@Expose()
	messages!: MessageDto[];

	@ApiProperty({
		example: false
	})
	@Expose()
	hasMore!: boolean;

	@ApiPropertyOptional({
		example: '2026-04-23T12:00:00.000Z',
		nullable: true,
		description: 'Use this value as before for the next older page.'
	})
	@Expose()
	nextBefore!: string | null;

	static from(messages: MessageListItem[], hasMore: boolean) {
		return plainToInstance(
			MessageListResponseDto,
			{
				messages: messages.map((message) => MessageDto.from(message)),
				hasMore,
				nextBefore: messages[0]?.createdAt.toISOString() ?? null
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class MessageResponseDto {
	@ApiProperty({
		type: MessageDto
	})
	@Expose()
	message!: MessageDto;

	static from(message: MessageListItem) {
		return plainToInstance(
			MessageResponseDto,
			{
				message: MessageDto.from(message)
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}
