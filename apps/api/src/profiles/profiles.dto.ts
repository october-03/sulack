import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { Profile } from '../generated/prisma/client';

export class ProfileDto {
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
	createdAt!: Date;

	@ApiProperty()
	@Expose()
	updatedAt!: Date;

	static from(profile: Profile) {
		return plainToInstance(ProfileDto, profile, {
			excludeExtraneousValues: true
		});
	}
}

export class ProfileResponseDto {
	@ApiProperty({
		type: ProfileDto
	})
	@Expose()
	profile!: ProfileDto;

	static from(profile: Profile) {
		return plainToInstance(
			ProfileResponseDto,
			{
				profile: ProfileDto.from(profile)
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}

export class UpdateMyProfileDto {
	@ApiPropertyOptional({
		example: 'Alice Kim'
	})
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	displayName?: string;

	@ApiPropertyOptional({
		example: 'https://example.com/alice.png',
		nullable: true
	})
	@IsOptional()
	@IsString()
	@MaxLength(2048)
	avatarUrl?: string | null;

	@ApiPropertyOptional({
		example: 'Heads down on profile APIs.',
		nullable: true
	})
	@IsOptional()
	@IsString()
	@MaxLength(160)
	statusMessage?: string | null;
}

export class SearchProfilesQueryDto {
	@ApiProperty({
		example: 'ali',
		description: 'Substring search across display name and email.'
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	q!: string;

	@ApiPropertyOptional({
		example: 20,
		default: 20,
		description: 'Maximum number of profiles to return.'
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number;
}

export class SearchProfileItemDto {
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

	static from(profile: Profile) {
		return plainToInstance(SearchProfileItemDto, profile, {
			excludeExtraneousValues: true
		});
	}
}

export class SearchProfilesResponseDto {
	@ApiProperty({
		type: SearchProfileItemDto,
		isArray: true
	})
	@Expose()
	profiles!: SearchProfileItemDto[];

	static from(profiles: Profile[]) {
		return plainToInstance(
			SearchProfilesResponseDto,
			{
				profiles: profiles.map((profile) => SearchProfileItemDto.from(profile))
			},
			{
				excludeExtraneousValues: true
			}
		);
	}
}
