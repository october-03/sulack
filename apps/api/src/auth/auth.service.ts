import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseUser } from './auth.types';

@Injectable()
export class AuthService {
	private readonly supabaseUrl: string;
	private readonly supabaseServiceRoleKey: string;

	constructor(private readonly configService: ConfigService) {
		const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
		const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

		if (!supabaseUrl) {
			throw new InternalServerErrorException('SUPABASE_URL is required for JWT verification.');
		}

		if (!supabaseServiceRoleKey) {
			throw new InternalServerErrorException('SUPABASE_SERVICE_ROLE_KEY is required for JWT verification.');
		}

		this.supabaseUrl = supabaseUrl;
		this.supabaseServiceRoleKey = supabaseServiceRoleKey;
	}

	async verifyAccessToken(accessToken: string): Promise<SupabaseUser> {
		const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
			headers: {
				apikey: this.supabaseServiceRoleKey,
				Authorization: `Bearer ${accessToken}`
			}
		});

		if (!response.ok) {
			throw new UnauthorizedException('Invalid or expired Supabase access token.');
		}

		const user = (await response.json()) as SupabaseUser;

		if (!user.id) {
			throw new UnauthorizedException('Supabase token verification succeeded but no user payload was returned.');
		}

		return user;
	}
}
