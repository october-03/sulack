import { apiRequest } from '@/api/http';
import type { SearchProfileItem } from '@/types/chat';

type SearchProfilesResponse = {
	profiles: SearchProfileItem[];
};

export async function searchProfiles(accessToken: string, query: string, signal?: AbortSignal) {
	const searchParams = new URLSearchParams({
		limit: '20',
		q: query
	});
	const data = await apiRequest<SearchProfilesResponse>(`/profiles/search?${searchParams.toString()}`, {
		accessToken,
		signal
	});

	return data.profiles;
}
