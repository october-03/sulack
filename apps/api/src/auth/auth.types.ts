export type SupabaseUser = {
	id: string;
	email?: string;
	role?: string;
	app_metadata?: Record<string, unknown>;
	user_metadata?: Record<string, unknown>;
};

export type AuthenticatedRequestUser = {
	accessToken: string;
	user: SupabaseUser;
};
