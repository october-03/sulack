import { apiRequest } from '@/api/http';
import type { DirectConversationItem } from '@/types/chat';

type DirectConversationListResponse = {
	conversations: DirectConversationItem[];
};

type DirectConversationResponse = {
	conversation: DirectConversationItem;
};

export async function getDirectConversations(accessToken: string, signal?: AbortSignal) {
	const data = await apiRequest<DirectConversationListResponse>('/direct-conversations', {
		accessToken,
		signal
	});

	return data.conversations;
}

export async function createDirectConversation(accessToken: string, userId: string) {
	const data = await apiRequest<DirectConversationResponse>('/direct-conversations', {
		accessToken,
		body: JSON.stringify({ userId }),
		headers: {
			'Content-Type': 'application/json'
		},
		method: 'POST'
	});

	return data.conversation;
}
