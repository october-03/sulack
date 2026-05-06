import { useMemo } from 'react';
import type { ChannelItem, DirectConversationItem } from '@/types/chat';

type UseChatSelectionOptions = {
	channelId: string | null;
	channels: ChannelItem[];
	conversationId: string | null;
	currentUserId: string | null;
	directConversations: DirectConversationItem[];
};

export function useChatSelection({
	channelId,
	channels,
	conversationId,
	currentUserId,
	directConversations
}: UseChatSelectionOptions) {
	const selectedChannel = channels.find((channel) => channel.id === channelId) ?? null;
	const selectedDirectConversation =
		directConversations.find((conversation) => conversation.id === conversationId) ?? null;
	const directConversationItems = useMemo(
		() =>
			directConversations.map((conversation) => {
				const counterpart =
					conversation.participants.find((participant) => participant.id !== currentUserId) ??
					conversation.participants[0];

				return {
					id: conversation.id,
					label: counterpart?.displayName ?? 'Unknown teammate'
				};
			}),
		[directConversations, currentUserId]
	);
	const selectedDirectConversationCounterpart =
		selectedDirectConversation?.participants.find((participant) => participant.id !== currentUserId) ??
		selectedDirectConversation?.participants[0] ??
		null;

	return {
		directConversationItems,
		selectedChannel,
		selectedDirectConversation,
		selectedDirectConversationCounterpart
	};
}
