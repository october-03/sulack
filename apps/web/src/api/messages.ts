import { apiRequest } from '@/api/http';
import type { MessageItem, MessageTarget } from '@/types/chat';

type MessageListResponse = {
	messages: MessageItem[];
	hasMore: boolean;
	nextBefore: string | null;
};

type MessageResponse = {
	message: MessageItem;
};

export function upsertMessage(messages: MessageItem[], incomingMessage: MessageItem) {
	const nextMessages = new Map(messages.map((message) => [message.id, message]));
	nextMessages.set(incomingMessage.id, {
		...nextMessages.get(incomingMessage.id),
		...incomingMessage
	});

	return [...nextMessages.values()].sort((firstMessage, secondMessage) => {
		const createdAtDiff = firstMessage.createdAt.localeCompare(secondMessage.createdAt);
		return createdAtDiff === 0 ? firstMessage.id.localeCompare(secondMessage.id) : createdAtDiff;
	});
}

export function getMessagePath(target: MessageTarget, targetId: string) {
	return target === 'channel' ? `/channels/${targetId}/messages` : `/direct-conversations/${targetId}/messages`;
}

export async function getMessages(accessToken: string, target: MessageTarget, targetId: string, signal?: AbortSignal) {
	const data = await apiRequest<MessageListResponse>(`${getMessagePath(target, targetId)}?limit=50`, {
		accessToken,
		signal
	});

	return data.messages;
}

export async function createMessage(accessToken: string, target: MessageTarget, targetId: string, content: string) {
	const data = await apiRequest<MessageResponse>(getMessagePath(target, targetId), {
		accessToken,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ content })
	});

	return data.message;
}

export async function updateMessage(accessToken: string, messageId: string, content: string) {
	const data = await apiRequest<MessageResponse>(`/messages/${messageId}`, {
		accessToken,
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ content })
	});

	return data.message;
}

export async function deleteMessage(accessToken: string, messageId: string) {
	const data = await apiRequest<MessageResponse>(`/messages/${messageId}`, {
		accessToken,
		method: 'DELETE'
	});

	return data.message;
}
