import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, plainToInstance } from 'class-transformer';
import { IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import type { AuthenticatedRequestUser, SupabaseUser } from './auth.types';

export class SupabaseUserDto {
	@ApiProperty({
		example: '2c4d6f9a-1234-4ef0-9f5f-0123456789ab'
	})
	@Expose()
	@IsUUID()
	id!: string;

	@ApiPropertyOptional({
		example: 'user@example.com'
	})
	@Expose()
	@IsOptional()
	@IsString()
	email?: string;

	@ApiPropertyOptional({
		example: 'authenticated'
	})
	@Expose()
	@IsOptional()
	@IsString()
	role?: string;

	@ApiPropertyOptional({
		example: {
			provider: 'email'
		},
		additionalProperties: true
	})
	@Expose()
	@IsOptional()
	@IsObject()
	app_metadata?: Record<string, unknown>;

	@ApiPropertyOptional({
		example: {
			nickname: 'sulack-user'
		},
		additionalProperties: true
	})
	@Expose()
	@IsOptional()
	@IsObject()
	user_metadata?: Record<string, unknown>;

	static from(payload: SupabaseUser) {
		return plainToInstance(SupabaseUserDto, payload, {
			excludeExtraneousValues: true
		});
	}
}

export class AuthMeResponseDto {
	@ApiProperty({
		type: SupabaseUserDto
	})
	@Expose()
	@Type(() => SupabaseUserDto)
	@ValidateNested()
	user!: SupabaseUserDto;

	static from(authUser: AuthenticatedRequestUser) {
		return plainToInstance(
			AuthMeResponseDto,
			{
				user: SupabaseUserDto.from(authUser.user)
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}
