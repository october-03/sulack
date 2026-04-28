import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { IsISO8601, IsString } from 'class-validator';

export class HelloResponseDto {
  @ApiProperty({
    example: 'Sulack API is running',
  })
  @Expose()
  @IsString()
  message!: string;

  static from(payload: { message: string }) {
    return plainToInstance(HelloResponseDto, payload, {
      excludeExtraneousValues: true,
    });
  }
}

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
  })
  @Expose()
  @IsString()
  status!: string;

  @ApiProperty({
    example: '2026-04-28T03:30:00.000Z',
  })
  @Expose()
  @IsISO8601()
  timestamp!: string;

  static from(payload: { status: string; timestamp: string }) {
    return plainToInstance(HealthResponseDto, payload, {
      excludeExtraneousValues: true,
    });
  }
}
