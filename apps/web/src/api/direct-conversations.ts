import { apiRequest } from '@/api/http';
import type { DirectConversationItem } from '@/types/chat';

type DirectConversationListResponse = {
	conversations: DirectConversationItem[];
};

export async function getDirectConversations(accessToken: string, signal?: AbortSignal) {
	const data = await apiRequest<DirectConversationListResponse>('/direct-conversations', {
		accessToken,
		signal
	});

	return data.conversations;
}
