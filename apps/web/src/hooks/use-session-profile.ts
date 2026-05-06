import type { Session } from '@supabase/supabase-js';

export function useSessionProfile(session: Session | null) {
	const profileEmail = session?.user.email ?? 'unknown user';
	const profileMetadataDisplayName = session?.user.user_metadata?.display_name;
	const profileName =
		typeof profileMetadataDisplayName === 'string' && profileMetadataDisplayName.trim()
			? profileMetadataDisplayName
			: profileEmail.split('@')[0];

	return {
		profileEmail,
		profileInitial: profileName.slice(0, 1).toUpperCase(),
		profileName
	};
}
