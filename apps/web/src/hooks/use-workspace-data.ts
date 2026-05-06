import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getChannels } from '@/api/channels';
import { getDirectConversations } from '@/api/direct-conversations';
import type { ChannelItem, DirectConversationItem } from '@/types/chat';

export function useWorkspaceData(session: Session | null, isSessionLoading: boolean) {
	const [channels, setChannels] = useState<ChannelItem[]>([]);
	const [channelError, setChannelError] = useState<string | null>(null);
	const [directConversations, setDirectConversations] = useState<DirectConversationItem[]>([]);
	const [directConversationError, setDirectConversationError] = useState<string | null>(null);
	const [isChannelsLoading, setIsChannelsLoading] = useState(false);
	const [isDirectConversationsLoading, setIsDirectConversationsLoading] = useState(false);

	useEffect(() => {
		if (isSessionLoading) {
			return;
		}

		if (!session) {
			setChannels([]);
			setChannelError(null);
			setIsChannelsLoading(false);
			return;
		}

		const abortController = new AbortController();

		const loadChannels = async () => {
			setIsChannelsLoading(true);
			setChannelError(null);

			try {
				setChannels(await getChannels(session.access_token, abortController.signal));
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}

				setChannels([]);
				setChannelError(
					error instanceof Error
						? `채널 목록을 불러오지 못했습니다. (${error.message})`
						: '채널 목록을 불러오지 못했습니다.'
				);
			} finally {
				setIsChannelsLoading(false);
			}
		};

		void loadChannels();

		return () => {
			abortController.abort();
		};
	}, [isSessionLoading, session]);

	useEffect(() => {
		if (isSessionLoading) {
			return;
		}

		if (!session) {
			setDirectConversations([]);
			setDirectConversationError(null);
			setIsDirectConversationsLoading(false);
			return;
		}

		const abortController = new AbortController();

		const loadDirectConversations = async () => {
			setIsDirectConversationsLoading(true);
			setDirectConversationError(null);

			try {
				setDirectConversations(await getDirectConversations(session.access_token, abortController.signal));
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}

				setDirectConversations([]);
				setDirectConversationError(
					error instanceof Error
						? `DM 목록을 불러오지 못했습니다. (${error.message})`
						: 'DM 목록을 불러오지 못했습니다.'
				);
			} finally {
				setIsDirectConversationsLoading(false);
			}
		};

		void loadDirectConversations();

		return () => {
			abortController.abort();
		};
	}, [isSessionLoading, session]);

	return {
		channelError,
		channels,
		directConversationError,
		directConversations,
		isChannelsLoading,
		isDirectConversationsLoading
	};
}
