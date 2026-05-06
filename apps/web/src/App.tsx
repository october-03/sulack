import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

type HealthResponse = {
	status: string;
	timestamp: string;
};

type ChannelItem = {
	id: string;
	name: string;
	description: string | null;
	visibility: 'public' | 'private';
	memberCount: number;
	membership: {
		role: 'admin' | 'member';
		joinedAt: string;
	} | null;
};

type ChannelListResponse = {
	channels: ChannelItem[];
};

type ChannelMember = {
	user: {
		id: string;
		email: string;
		displayName: string;
		avatarUrl: string | null;
		statusMessage: string | null;
	};
	role: 'admin' | 'member';
	joinedAt: string;
};

type ChannelMembersResponse = {
	members: ChannelMember[];
};

type DirectConversationParticipant = {
	id: string;
	email: string;
	displayName: string;
	avatarUrl: string | null;
	statusMessage: string | null;
	joinedAt: string;
};

type DirectConversationItem = {
	id: string;
	createdAt: string;
	participants: DirectConversationParticipant[];
};

type DirectConversationListResponse = {
	conversations: DirectConversationItem[];
};

type MessageItem = {
	id: string;
	channelId: string | null;
	conversationId: string | null;
	author: {
		id: string;
		email: string;
		displayName: string;
		avatarUrl: string | null;
		statusMessage: string | null;
	};
	content: string;
	messageType: 'text' | 'system' | 'file';
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	attachments: Array<{
		id: string;
		originalName: string;
		mimeType: string;
		sizeBytes: string;
	}>;
};

type MessageListResponse = {
	messages: MessageItem[];
	hasMore: boolean;
	nextBefore: string | null;
};

type MessageResponse = {
	message: MessageItem;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const dmDateFormatter = new Intl.DateTimeFormat('ko-KR', {
	month: 'short',
	day: 'numeric'
});
const messageTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

type MessageTarget = 'channel' | 'directConversation';

function upsertMessage(messages: MessageItem[], incomingMessage: MessageItem) {
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

function App() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [authError, setAuthError] = useState<string | null>(null);
	const [channels, setChannels] = useState<ChannelItem[]>([]);
	const [channelError, setChannelError] = useState<string | null>(null);
	const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
	const [directConversations, setDirectConversations] = useState<DirectConversationItem[]>([]);
	const [channelMembersError, setChannelMembersError] = useState<string | null>(null);
	const [directConversationError, setDirectConversationError] = useState<string | null>(null);
	const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
	const [selectedDirectConversationId, setSelectedDirectConversationId] = useState<string | null>(null);
	const [channelMessageDraft, setChannelMessageDraft] = useState('');
	const [directConversationMessageDraft, setDirectConversationMessageDraft] = useState('');
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editingMessageDraft, setEditingMessageDraft] = useState('');
	const [messageComposerError, setMessageComposerError] = useState<string | null>(null);
	const [messageComposerStatus, setMessageComposerStatus] = useState<string | null>(null);
	const [channelMessages, setChannelMessages] = useState<MessageItem[]>([]);
	const [directConversationMessages, setDirectConversationMessages] = useState<MessageItem[]>([]);
	const [channelMessagesError, setChannelMessagesError] = useState<string | null>(null);
	const [directConversationMessagesError, setDirectConversationMessagesError] = useState<string | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [isSessionLoading, setIsSessionLoading] = useState(true);
	const [isChannelsLoading, setIsChannelsLoading] = useState(false);
	const [isChannelMembersLoading, setIsChannelMembersLoading] = useState(false);
	const [isDirectConversationsLoading, setIsDirectConversationsLoading] = useState(false);
	const [isMessageSending, setIsMessageSending] = useState(false);
	const [isMessageMutating, setIsMessageMutating] = useState(false);
	const [isChannelMessagesLoading, setIsChannelMessagesLoading] = useState(false);
	const [isDirectConversationMessagesLoading, setIsDirectConversationMessagesLoading] = useState(false);
	const selectedChannelIdRef = useRef<string | null>(null);
	const selectedDirectConversationIdRef = useRef<string | null>(null);

	useEffect(() => {
		selectedChannelIdRef.current = selectedChannelId;
	}, [selectedChannelId]);

	useEffect(() => {
		selectedDirectConversationIdRef.current = selectedDirectConversationId;
	}, [selectedDirectConversationId]);

	useEffect(() => {
		void fetch(`${apiBaseUrl}/health`)
			.then(async (response) => response.json() as Promise<HealthResponse>)
			.then((data) => setHealth(data))
			.catch(() => setHealth(null));
	}, []);

	useEffect(() => {
		let isMounted = true;

		void supabase.auth.getSession().then(({ data, error }) => {
			if (!isMounted) {
				return;
			}

			setSession(data.session);
			setAuthError(error?.message ?? null);
			setIsSessionLoading(false);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
			setAuthError(null);
			setIsSessionLoading(false);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (!session) {
			setChannels([]);
			setChannelMembers([]);
			setDirectConversations([]);
			setSelectedChannelId(null);
			setSelectedDirectConversationId(null);
			setChannelMessageDraft('');
			setDirectConversationMessageDraft('');
			setEditingMessageId(null);
			setEditingMessageDraft('');
			setChannelMessages([]);
			setDirectConversationMessages([]);
			setChannelError(null);
			setChannelMembersError(null);
			setDirectConversationError(null);
			setChannelMessagesError(null);
			setDirectConversationMessagesError(null);
			setMessageComposerError(null);
			setMessageComposerStatus(null);
			setIsChannelsLoading(false);
			setIsChannelMembersLoading(false);
			setIsDirectConversationsLoading(false);
			setIsChannelMessagesLoading(false);
			setIsDirectConversationMessagesLoading(false);
			setIsMessageSending(false);
			setIsMessageMutating(false);
			return;
		}

		let isCancelled = false;

		const loadChannels = async () => {
			setIsChannelsLoading(true);
			setChannelError(null);

			try {
				const response = await fetch(`${apiBaseUrl}/channels`, {
					headers: {
						Authorization: `Bearer ${session.access_token}`
					}
				});

				if (!response.ok) {
					throw new Error(`채널 목록을 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as ChannelListResponse;

				if (isCancelled) {
					return;
				}

				setChannels(data.channels);
				setSelectedChannelId((currentSelectedChannelId) => {
					if (currentSelectedChannelId && data.channels.some((channel) => channel.id === currentSelectedChannelId)) {
						return currentSelectedChannelId;
					}

					return data.channels[0]?.id ?? null;
				});
			} catch (error) {
				if (isCancelled) {
					return;
				}

				setChannels([]);
				setSelectedChannelId(null);
				setChannelError(error instanceof Error ? error.message : '채널 목록을 불러오지 못했습니다.');
			} finally {
				if (!isCancelled) {
					setIsChannelsLoading(false);
				}
			}
		};

		void loadChannels();

		return () => {
			isCancelled = true;
		};
	}, [session]);

	useEffect(() => {
		if (!session) {
			setDirectConversations([]);
			setSelectedDirectConversationId(null);
			setDirectConversationError(null);
			setIsDirectConversationsLoading(false);
			return;
		}

		let isCancelled = false;

		const loadDirectConversations = async () => {
			setIsDirectConversationsLoading(true);
			setDirectConversationError(null);

			try {
				const response = await fetch(`${apiBaseUrl}/direct-conversations`, {
					headers: {
						Authorization: `Bearer ${session.access_token}`
					}
				});

				if (!response.ok) {
					throw new Error(`DM 목록을 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as DirectConversationListResponse;

				if (isCancelled) {
					return;
				}

				setDirectConversations(data.conversations);
				setSelectedDirectConversationId((currentSelectedDirectConversationId) => {
					if (
						currentSelectedDirectConversationId &&
						data.conversations.some((conversation) => conversation.id === currentSelectedDirectConversationId)
					) {
						return currentSelectedDirectConversationId;
					}

					return data.conversations[0]?.id ?? null;
				});
			} catch (error) {
				if (isCancelled) {
					return;
				}

				setDirectConversations([]);
				setSelectedDirectConversationId(null);
				setDirectConversationError(error instanceof Error ? error.message : 'DM 목록을 불러오지 못했습니다.');
			} finally {
				if (!isCancelled) {
					setIsDirectConversationsLoading(false);
				}
			}
		};

		void loadDirectConversations();

		return () => {
			isCancelled = true;
		};
	}, [session]);

	useEffect(() => {
		if (!session || !selectedChannelId) {
			setChannelMembers([]);
			setChannelMembersError(null);
			setIsChannelMembersLoading(false);
			return;
		}

		let isCancelled = false;

		const loadChannelMembers = async () => {
			setIsChannelMembersLoading(true);
			setChannelMembersError(null);

			try {
				const response = await fetch(`${apiBaseUrl}/channels/${selectedChannelId}/members`, {
					headers: {
						Authorization: `Bearer ${session.access_token}`
					}
				});

				if (!response.ok) {
					throw new Error(`채널 멤버를 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as ChannelMembersResponse;

				if (isCancelled) {
					return;
				}

				setChannelMembers(data.members);
			} catch (error) {
				if (isCancelled) {
					return;
				}

				setChannelMembers([]);
				setChannelMembersError(error instanceof Error ? error.message : '채널 멤버를 불러오지 못했습니다.');
			} finally {
				if (!isCancelled) {
					setIsChannelMembersLoading(false);
				}
			}
		};

		void loadChannelMembers();

		return () => {
			isCancelled = true;
		};
	}, [selectedChannelId, session]);

	const loadChannelMessages = useCallback(
		async (options?: { signal?: AbortSignal; silent?: boolean }) => {
			if (!session || !selectedChannelId) {
				setChannelMessages([]);
				setChannelMessagesError(null);
				setIsChannelMessagesLoading(false);
				return;
			}

			const requestedChannelId = selectedChannelId;

			if (!options?.silent) {
				setIsChannelMessagesLoading(true);
			}
			setChannelMessagesError(null);

			try {
				const response = await fetch(`${apiBaseUrl}/channels/${requestedChannelId}/messages?limit=50`, {
					headers: {
						Authorization: `Bearer ${session.access_token}`
					},
					signal: options?.signal
				});

				if (!response.ok) {
					throw new Error(`채널 메시지를 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as MessageListResponse;

				if (selectedChannelIdRef.current !== requestedChannelId) {
					return;
				}

				setChannelMessages(data.messages);
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}

				if (!options?.silent) {
					setChannelMessages([]);
				}
				setChannelMessagesError(error instanceof Error ? error.message : '채널 메시지를 불러오지 못했습니다.');
			} finally {
				if (!options?.silent) {
					setIsChannelMessagesLoading(false);
				}
			}
		},
		[selectedChannelId, session]
	);

	useEffect(() => {
		const abortController = new AbortController();

		void loadChannelMessages({ signal: abortController.signal });

		return () => {
			abortController.abort();
		};
	}, [loadChannelMessages]);

	useEffect(() => {
		if (!session || !selectedChannelId) {
			return;
		}

		console.info('[Realtime] channel subscription target changed', {
			channelId: selectedChannelId,
			userId: session.user.id,
			hasAccessToken: Boolean(session.access_token)
		});

		supabase.realtime.setAuth(session.access_token);
		console.info('[Realtime] access token applied to realtime client', {
			channelId: selectedChannelId,
			userId: session.user.id
		});

		const realtimeChannel = supabase
			.channel(`messages:channel:${selectedChannelId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages'
				},
				(payload) => {
					console.info('[Realtime] unfiltered message insert received', {
						selectedChannelId,
						eventType: payload.eventType,
						messageId: payload.new.id,
						channelId: payload.new.channel_id,
						conversationId: payload.new.conversation_id,
						payload
					});
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `channel_id=eq.${selectedChannelId}`
				},
				(payload) => {
					console.info('[Realtime] channel message received', {
						channelId: selectedChannelId,
						eventType: payload.eventType,
						messageId: payload.new.id,
						payloadChannelId: payload.new.channel_id,
						payload
					});
					void loadChannelMessages({ silent: true });
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'messages',
					filter: `channel_id=eq.${selectedChannelId}`
				},
				(payload) => {
					console.info('[Realtime] channel message updated', {
						channelId: selectedChannelId,
						eventType: payload.eventType,
						messageId: payload.new.id,
						payloadChannelId: payload.new.channel_id,
						deletedAt: payload.new.deleted_at,
						payload
					});
					void loadChannelMessages({ silent: true });
				}
			)
			.subscribe((status) => {
				console.info('[Realtime] channel subscription status changed', {
					channelId: selectedChannelId,
					status,
					userId: session.user.id,
					hasAccessToken: Boolean(session.access_token)
				});

				if (status === 'SUBSCRIBED') {
					console.info('[Realtime] channel subscription ready', {
						channelId: selectedChannelId,
						userId: session.user.id
					});
				}

				if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
					setChannelMessagesError('채널 메시지 실시간 구독이 끊겼습니다. 잠시 후 다시 시도해주세요.');
				}
			});

		return () => {
			console.info('[Realtime] channel subscription removed', {
				channelId: selectedChannelId
			});
			void supabase.removeChannel(realtimeChannel);
		};
	}, [loadChannelMessages, selectedChannelId, session]);

	const loadDirectConversationMessages = useCallback(
		async (options?: { signal?: AbortSignal; silent?: boolean }) => {
			if (!session || !selectedDirectConversationId) {
				setDirectConversationMessages([]);
				setDirectConversationMessagesError(null);
				setIsDirectConversationMessagesLoading(false);
				return;
			}

			const requestedDirectConversationId = selectedDirectConversationId;

			if (!options?.silent) {
				setIsDirectConversationMessagesLoading(true);
			}
			setDirectConversationMessagesError(null);

			try {
				const response = await fetch(
					`${apiBaseUrl}/direct-conversations/${requestedDirectConversationId}/messages?limit=50`,
					{
						headers: {
							Authorization: `Bearer ${session.access_token}`
						},
						signal: options?.signal
					}
				);

				if (!response.ok) {
					throw new Error(`DM 메시지를 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as MessageListResponse;

				if (selectedDirectConversationIdRef.current !== requestedDirectConversationId) {
					return;
				}

				setDirectConversationMessages(data.messages);
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}

				if (!options?.silent) {
					setDirectConversationMessages([]);
				}
				setDirectConversationMessagesError(error instanceof Error ? error.message : 'DM 메시지를 불러오지 못했습니다.');
			} finally {
				if (!options?.silent) {
					setIsDirectConversationMessagesLoading(false);
				}
			}
		},
		[selectedDirectConversationId, session]
	);

	useEffect(() => {
		const abortController = new AbortController();

		void loadDirectConversationMessages({ signal: abortController.signal });

		return () => {
			abortController.abort();
		};
	}, [loadDirectConversationMessages]);

	useEffect(() => {
		if (!session || !selectedDirectConversationId) {
			return;
		}

		console.info('[Realtime] direct conversation subscription target changed', {
			conversationId: selectedDirectConversationId,
			userId: session.user.id,
			hasAccessToken: Boolean(session.access_token)
		});

		supabase.realtime.setAuth(session.access_token);
		console.info('[Realtime] access token applied to direct conversation realtime client', {
			conversationId: selectedDirectConversationId,
			userId: session.user.id
		});

		const realtimeChannel = supabase
			.channel(`messages:conversation:${selectedDirectConversationId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `conversation_id=eq.${selectedDirectConversationId}`
				},
				(payload) => {
					console.info('[Realtime] direct conversation message received', {
						conversationId: selectedDirectConversationId,
						eventType: payload.eventType,
						messageId: payload.new.id,
						payloadConversationId: payload.new.conversation_id,
						payload
					});
					void loadDirectConversationMessages({ silent: true });
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'messages',
					filter: `conversation_id=eq.${selectedDirectConversationId}`
				},
				(payload) => {
					console.info('[Realtime] direct conversation message updated', {
						conversationId: selectedDirectConversationId,
						eventType: payload.eventType,
						messageId: payload.new.id,
						payloadConversationId: payload.new.conversation_id,
						deletedAt: payload.new.deleted_at,
						payload
					});
					void loadDirectConversationMessages({ silent: true });
				}
			)
			.subscribe((status) => {
				console.info('[Realtime] direct conversation subscription status changed', {
					conversationId: selectedDirectConversationId,
					status,
					userId: session.user.id,
					hasAccessToken: Boolean(session.access_token)
				});

				if (status === 'SUBSCRIBED') {
					console.info('[Realtime] direct conversation subscription ready', {
						conversationId: selectedDirectConversationId,
						userId: session.user.id
					});
				}

				if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
					setDirectConversationMessagesError('DM 메시지 실시간 구독이 끊겼습니다. 잠시 후 다시 시도해주세요.');
				}
			});

		return () => {
			console.info('[Realtime] direct conversation subscription removed', {
				conversationId: selectedDirectConversationId
			});
			void supabase.removeChannel(realtimeChannel);
		};
	}, [loadDirectConversationMessages, selectedDirectConversationId, session]);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			setAuthError(error.message);
		} else {
			setPassword('');
		}

		setIsAuthLoading(false);
	};

	const handleLogout = async () => {
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await supabase.auth.signOut();

		if (error) {
			setAuthError(error.message);
		}

		setIsAuthLoading(false);
	};

	const handleSendMessage = async (event: FormEvent<HTMLFormElement>, target: MessageTarget) => {
		event.preventDefault();

		if (!session) {
			setMessageComposerError('로그인 후 메시지를 보낼 수 있습니다.');
			return;
		}

		const isChannelTarget = target === 'channel';
		const targetId = isChannelTarget ? selectedChannelId : selectedDirectConversationId;
		const content = isChannelTarget ? channelMessageDraft.trim() : directConversationMessageDraft.trim();

		if (!targetId) {
			setMessageComposerError(
				isChannelTarget ? '메시지를 보낼 채널을 선택해주세요.' : '메시지를 보낼 DM을 선택해주세요.'
			);
			return;
		}

		if (!content) {
			setMessageComposerError('메시지 내용을 입력해주세요.');
			return;
		}

		setIsMessageSending(true);
		setMessageComposerError(null);
		setMessageComposerStatus(null);

		const endpoint = isChannelTarget
			? `${apiBaseUrl}/channels/${targetId}/messages`
			: `${apiBaseUrl}/direct-conversations/${targetId}/messages`;

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content
				})
			});

			if (!response.ok) {
				throw new Error(`메시지를 보내지 못했습니다. (${response.status})`);
			}

			const data = (await response.json()) as MessageResponse;

			if (isChannelTarget) {
				console.info('[Messages] channel message sent', {
					selectedChannelId,
					responseChannelId: data.message.channelId,
					messageId: data.message.id
				});
				setChannelMessageDraft('');
				setChannelMessages((currentMessages) => upsertMessage(currentMessages, data.message));
				setMessageComposerStatus('채널 메시지를 보냈습니다.');
			} else {
				console.info('[Messages] direct conversation message sent', {
					selectedDirectConversationId,
					responseConversationId: data.message.conversationId,
					messageId: data.message.id
				});
				setDirectConversationMessageDraft('');
				setDirectConversationMessages((currentMessages) => upsertMessage(currentMessages, data.message));
				setMessageComposerStatus('DM 메시지를 보냈습니다.');
			}
		} catch (error) {
			setMessageComposerError(error instanceof Error ? error.message : '메시지를 보내지 못했습니다.');
		} finally {
			setIsMessageSending(false);
		}
	};

	const applyMessageResponse = (message: MessageItem) => {
		if (message.channelId) {
			setChannelMessages((currentMessages) => upsertMessage(currentMessages, message));
		}

		if (message.conversationId) {
			setDirectConversationMessages((currentMessages) => upsertMessage(currentMessages, message));
		}
	};

	const handleStartEditMessage = (message: MessageItem) => {
		setEditingMessageId(message.id);
		setEditingMessageDraft(message.content);
		setMessageComposerError(null);
		setMessageComposerStatus(null);
	};

	const handleCancelEditMessage = () => {
		setEditingMessageId(null);
		setEditingMessageDraft('');
	};

	const handleUpdateMessage = async (event: FormEvent<HTMLFormElement>, message: MessageItem) => {
		event.preventDefault();

		if (!session) {
			setMessageComposerError('로그인 후 메시지를 수정할 수 있습니다.');
			return;
		}

		const content = editingMessageDraft.trim();

		if (!content) {
			setMessageComposerError('수정할 메시지 내용을 입력해주세요.');
			return;
		}

		setIsMessageMutating(true);
		setMessageComposerError(null);
		setMessageComposerStatus(null);

		try {
			const response = await fetch(`${apiBaseUrl}/messages/${message.id}`, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content
				})
			});

			if (!response.ok) {
				throw new Error(`메시지를 수정하지 못했습니다. (${response.status})`);
			}

			const data = (await response.json()) as MessageResponse;
			applyMessageResponse(data.message);
			setEditingMessageId(null);
			setEditingMessageDraft('');
			setMessageComposerStatus('메시지를 수정했습니다.');
		} catch (error) {
			setMessageComposerError(error instanceof Error ? error.message : '메시지를 수정하지 못했습니다.');
		} finally {
			setIsMessageMutating(false);
		}
	};

	const handleDeleteMessage = async (message: MessageItem) => {
		if (!session) {
			setMessageComposerError('로그인 후 메시지를 삭제할 수 있습니다.');
			return;
		}

		if (!window.confirm('이 메시지를 삭제할까요?')) {
			return;
		}

		setIsMessageMutating(true);
		setMessageComposerError(null);
		setMessageComposerStatus(null);

		try {
			const response = await fetch(`${apiBaseUrl}/messages/${message.id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${session.access_token}`
				}
			});

			if (!response.ok) {
				throw new Error(`메시지를 삭제하지 못했습니다. (${response.status})`);
			}

			const data = (await response.json()) as MessageResponse;
			applyMessageResponse(data.message);
			setEditingMessageId((currentEditingMessageId) =>
				currentEditingMessageId === message.id ? null : currentEditingMessageId
			);
			setMessageComposerStatus('메시지를 삭제했습니다.');
		} catch (error) {
			setMessageComposerError(error instanceof Error ? error.message : '메시지를 삭제하지 못했습니다.');
		} finally {
			setIsMessageMutating(false);
		}
	};

	const userEmail = session?.user.email ?? 'unknown user';
	const lastSeen = health?.timestamp ?? 'Start the API server to see live status.';
	const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
	const selectedDirectConversation =
		directConversations.find((conversation) => conversation.id === selectedDirectConversationId) ?? null;
	const directConversationItems = directConversations.map((conversation) => {
		const counterpart =
			conversation.participants.find((participant) => participant.id !== session?.user.id) ??
			conversation.participants[0];

		return {
			conversation,
			counterpart,
			label: counterpart?.displayName ?? 'Unknown teammate'
		};
	});
	const selectedDirectConversationCounterpart =
		selectedDirectConversation?.participants.find((participant) => participant.id !== session?.user.id) ??
		selectedDirectConversation?.participants[0] ??
		null;
	const renderMessageList = (
		messages: MessageItem[],
		isLoading: boolean,
		error: string | null,
		emptyMessage: string,
		ariaLabel: string
	) => {
		if (isLoading) {
			return <p className="helper-text">메시지를 불러오는 중입니다...</p>;
		}

		if (error) {
			return <p className="error-message">{error}</p>;
		}

		if (messages.length === 0) {
			return <p className="helper-text">{emptyMessage}</p>;
		}

		return (
			<div className="message-list" role="list" aria-label={ariaLabel}>
				{messages.map((message) => {
					const isMine = message.author.id === session?.user.id;
					const canMutate = isMine && !message.deletedAt;
					const isEditing = editingMessageId === message.id;

					return (
						<article key={message.id} className={`message-row${isMine ? ' message-row-mine' : ''}`}>
							<div className="member-avatar message-avatar" aria-hidden="true">
								{message.author.displayName.slice(0, 1).toUpperCase()}
							</div>
							<div className="message-bubble">
								<div className="message-meta">
									<strong>{message.author.displayName}</strong>
									<span>{messageTimeFormatter.format(new Date(message.createdAt))}</span>
								</div>
								{isEditing ? (
									<form className="message-edit-form" onSubmit={(event) => void handleUpdateMessage(event, message)}>
										<textarea
											value={editingMessageDraft}
											onChange={(event) => setEditingMessageDraft(event.target.value)}
											rows={3}
											maxLength={4000}
											disabled={isMessageMutating}
										/>
										<div className="message-actions">
											<small>{editingMessageDraft.trim().length}/4000</small>
											<div className="message-action-buttons">
												<button type="submit" disabled={isMessageMutating || !editingMessageDraft.trim()}>
													Save
												</button>
												<button type="button" onClick={handleCancelEditMessage} disabled={isMessageMutating}>
													Cancel
												</button>
											</div>
										</div>
									</form>
								) : (
									<p>{message.deletedAt ? '삭제된 메시지입니다.' : message.content}</p>
								)}
								{canMutate && !isEditing ? (
									<div className="message-actions">
										<button type="button" onClick={() => handleStartEditMessage(message)} disabled={isMessageMutating}>
											Edit
										</button>
										<button
											type="button"
											onClick={() => void handleDeleteMessage(message)}
											disabled={isMessageMutating}
										>
											Delete
										</button>
									</div>
								) : null}
							</div>
						</article>
					);
				})}
			</div>
		);
	};

	return (
		<main className="workspace-shell">
			<aside className="sidebar">
				<div className="sidebar-header">
					<p className="eyebrow">Sulack</p>
					<h1>Channels</h1>
					<p className="sidebar-copy">
						{session
							? '공개 채널과 내가 접근 가능한 비공개 채널을 한눈에 확인할 수 있습니다.'
							: '로그인하면 채널 목록이 여기에 표시됩니다.'}
					</p>
				</div>

				<div className="sidebar-panel">
					<div className="sidebar-panel-heading">
						<span>Browse</span>
						<strong>{session ? `${channels.length} channels` : 'Sign in required'}</strong>
					</div>

					{isSessionLoading ? <p className="helper-text">세션을 확인하는 중입니다...</p> : null}
					{!isSessionLoading && !session ? (
						<p className="helper-text">좌측 채널 목록은 로그인 후 자동으로 불러옵니다.</p>
					) : null}
					{session && isChannelsLoading ? <p className="helper-text">채널 목록을 불러오는 중입니다...</p> : null}
					{session && channelError ? <p className="error-message">{channelError}</p> : null}
					{session && !isChannelsLoading && !channelError && channels.length === 0 ? (
						<p className="helper-text">아직 표시할 채널이 없습니다. API에서 첫 채널을 생성해보세요.</p>
					) : null}

					{session && channels.length > 0 ? (
						<div className="channel-list" role="list" aria-label="Channels">
							{channels.map((channel) => {
								const isSelected = channel.id === selectedChannelId;

								return (
									<button
										key={channel.id}
										type="button"
										className={`channel-card${isSelected ? ' channel-card-active' : ''}`}
										onClick={() => setSelectedChannelId(channel.id)}
									>
										<div className="channel-card-top">
											<div>
												<span className="channel-prefix">{channel.visibility === 'public' ? '#' : 'private'}</span>
												<strong>{channel.name}</strong>
											</div>
											<span className="channel-pill">{channel.membership?.role ?? 'guest'}</span>
										</div>
										<p>{channel.description ?? '채널 설명이 아직 없습니다.'}</p>
										<div className="channel-meta">
											<span>{channel.memberCount} members</span>
											<span>{channel.visibility}</span>
										</div>
									</button>
								);
							})}
						</div>
					) : null}
				</div>

				<div className="sidebar-panel">
					<div className="sidebar-panel-heading">
						<span>Direct Messages</span>
						<strong>{session ? `${directConversations.length} threads` : 'Sign in required'}</strong>
					</div>

					{isSessionLoading ? <p className="helper-text">세션을 확인하는 중입니다...</p> : null}
					{!isSessionLoading && !session ? (
						<p className="helper-text">로그인 후 현재 사용자의 1:1 DM 목록을 불러옵니다.</p>
					) : null}
					{session && isDirectConversationsLoading ? (
						<p className="helper-text">DM 목록을 불러오는 중입니다...</p>
					) : null}
					{session && directConversationError ? <p className="error-message">{directConversationError}</p> : null}
					{session && !isDirectConversationsLoading && !directConversationError && directConversations.length === 0 ? (
						<p className="helper-text">
							아직 시작한 1:1 DM이 없습니다. 사용자 검색과 DM 생성 흐름을 붙이면 여기에 표시됩니다.
						</p>
					) : null}

					{session && directConversations.length > 0 ? (
						<div className="dm-list" role="list" aria-label="Direct messages">
							{directConversationItems.map(({ conversation, counterpart, label }) => {
								const isSelected = conversation.id === selectedDirectConversationId;

								return (
									<button
										key={conversation.id}
										type="button"
										className={`dm-card${isSelected ? ' dm-card-active' : ''}`}
										onClick={() => setSelectedDirectConversationId(conversation.id)}
									>
										<div className="dm-card-top">
											<div className="member-avatar dm-avatar" aria-hidden="true">
												{label.slice(0, 1).toUpperCase()}
											</div>
											<div className="dm-copy">
												<strong>{label}</strong>
												<span>{counterpart?.email ?? 'No email available'}</span>
											</div>
											<span className="channel-pill">{dmDateFormatter.format(new Date(conversation.createdAt))}</span>
										</div>
										<p>{counterpart?.statusMessage ?? '대화를 시작할 준비가 된 동료입니다.'}</p>
									</button>
								);
							})}
						</div>
					) : null}
				</div>
			</aside>

			<section className="content-panel">
				<div className="hero">
					<p className="eyebrow">Supabase Auth</p>
					<h2>{selectedChannel ? selectedChannel.name : 'Sulack Access Portal'}</h2>
					<p className="description">
						{selectedChannel
							? (selectedChannel.description ??
								'채널 설명이 아직 없습니다. 이제 메시지 패널과 채널 상세 화면을 이어서 붙일 수 있습니다.')
							: '이메일 기반 로그인으로 세션을 유지하고, 보호된 API 요청에 access token을 연결하는 흐름을 확인할 수 있습니다.'}
					</p>

					{selectedChannel ? (
						<div className="channel-spotlight">
							<div className="spotlight-stat">
								<span>Visibility</span>
								<strong>{selectedChannel.visibility}</strong>
							</div>
							<div className="spotlight-stat">
								<span>Members</span>
								<strong>{selectedChannel.memberCount}</strong>
							</div>
							<div className="spotlight-stat">
								<span>My role</span>
								<strong>{selectedChannel.membership?.role ?? 'not joined'}</strong>
							</div>
						</div>
					) : null}

					<section className="message-composer-panel">
						<div className="members-panel-heading">
							<div>
								<span className="card-kicker">Channel Messages</span>
								<h3>{selectedChannel ? `# ${selectedChannel.name}` : 'Select a channel'}</h3>
							</div>
							{selectedChannel ? <span className="channel-pill">Channel</span> : null}
						</div>

						{!session ? <p className="helper-text">로그인 후 채널 메시지를 확인할 수 있습니다.</p> : null}
						{session && !selectedChannel ? <p className="helper-text">좌측에서 채널을 선택해주세요.</p> : null}
						{session && selectedChannel
							? renderMessageList(
									channelMessages,
									isChannelMessagesLoading,
									channelMessagesError,
									'아직 채널 메시지가 없습니다.',
									'Channel messages'
								)
							: null}

						<form className="message-composer-form" onSubmit={(event) => void handleSendMessage(event, 'channel')}>
							<label className="field">
								<span>Message</span>
								<textarea
									value={channelMessageDraft}
									onChange={(event) => setChannelMessageDraft(event.target.value)}
									placeholder={
										selectedChannel ? `${selectedChannel.name}에 메시지 보내기` : '좌측에서 채널을 선택하세요'
									}
									rows={4}
									maxLength={4000}
									disabled={!session || !selectedChannel || isMessageSending}
								/>
							</label>
							<div className="composer-actions">
								<small>{channelMessageDraft.trim().length}/4000</small>
								<button
									className="primary-button"
									type="submit"
									disabled={!session || !selectedChannel || isMessageSending || !channelMessageDraft.trim()}
								>
									{isMessageSending ? 'Sending...' : 'Send'}
								</button>
							</div>
						</form>

						{messageComposerStatus ? <p className="helper-text">{messageComposerStatus}</p> : null}
						{messageComposerError ? <p className="error-message">{messageComposerError}</p> : null}
					</section>

					<section className="members-panel">
						<div className="members-panel-heading">
							<div>
								<span className="card-kicker">Channel Members</span>
								<h3>{selectedChannel ? `${selectedChannel.name} members` : 'Select a channel'}</h3>
							</div>
							{selectedChannel ? <strong>{channelMembers.length}</strong> : null}
						</div>

						{!session ? <p className="helper-text">로그인 후 선택한 채널의 멤버 목록이 여기에 표시됩니다.</p> : null}
						{session && !selectedChannel ? (
							<p className="helper-text">좌측에서 채널을 선택하면 멤버 목록을 볼 수 있습니다.</p>
						) : null}
						{session && selectedChannel && isChannelMembersLoading ? (
							<p className="helper-text">채널 멤버를 불러오는 중입니다...</p>
						) : null}
						{session && selectedChannel && channelMembersError ? (
							<p className="error-message">{channelMembersError}</p>
						) : null}
						{session &&
						selectedChannel &&
						!isChannelMembersLoading &&
						!channelMembersError &&
						channelMembers.length === 0 ? (
							<p className="helper-text">아직 표시할 멤버가 없습니다.</p>
						) : null}

						{channelMembers.length > 0 ? (
							<div className="member-list" role="list" aria-label="Channel members">
								{channelMembers.map((member) => (
									<article key={member.user.id} className="member-card">
										<div className="member-card-top">
											<div className="member-avatar" aria-hidden="true">
												{member.user.displayName.slice(0, 1).toUpperCase()}
											</div>
											<div className="member-copy">
												<strong>{member.user.displayName}</strong>
												<span>{member.user.email}</span>
											</div>
											<span className="channel-pill">{member.role}</span>
										</div>
										<p>{member.user.statusMessage ?? '상태 메시지가 아직 없습니다.'}</p>
									</article>
								))}
							</div>
						) : null}
					</section>

					<section className="members-panel">
						<div className="members-panel-heading">
							<div>
								<span className="card-kicker">Direct Messages</span>
								<h3>{selectedDirectConversationCounterpart?.displayName ?? 'Select a DM'}</h3>
							</div>
							{selectedDirectConversation ? <strong>{selectedDirectConversation.participants.length}</strong> : null}
						</div>

						{!session ? <p className="helper-text">로그인 후 DM 목록과 상대방 정보를 확인할 수 있습니다.</p> : null}
						{session && isDirectConversationsLoading ? (
							<p className="helper-text">DM 목록을 불러오는 중입니다...</p>
						) : null}
						{session && !isDirectConversationsLoading && directConversationError ? (
							<p className="error-message">{directConversationError}</p>
						) : null}
						{session &&
						!isDirectConversationsLoading &&
						!directConversationError &&
						directConversations.length === 0 ? (
							<p className="helper-text">기존 DM이 생기면 이 패널에서 상대방 정보를 빠르게 확인할 수 있습니다.</p>
						) : null}

						{selectedDirectConversation && selectedDirectConversationCounterpart ? (
							<article className="member-card dm-detail-card">
								<div className="member-card-top">
									<div className="member-avatar member-avatar-large" aria-hidden="true">
										{selectedDirectConversationCounterpart.displayName.slice(0, 1).toUpperCase()}
									</div>
									<div className="member-copy">
										<strong>{selectedDirectConversationCounterpart.displayName}</strong>
										<span>{selectedDirectConversationCounterpart.email}</span>
									</div>
									<span className="channel-pill">1:1 DM</span>
								</div>
								<p>{selectedDirectConversationCounterpart.statusMessage ?? '아직 상태 메시지가 없습니다.'}</p>
								<div className="channel-meta">
									<span>Started {dmDateFormatter.format(new Date(selectedDirectConversation.createdAt))}</span>
									<span>{selectedDirectConversation.id.slice(0, 8)}</span>
								</div>
							</article>
						) : null}

						{session && selectedDirectConversation
							? renderMessageList(
									directConversationMessages,
									isDirectConversationMessagesLoading,
									directConversationMessagesError,
									'아직 DM 메시지가 없습니다.',
									'Direct conversation messages'
								)
							: null}

						<form
							className="message-composer-form"
							onSubmit={(event) => void handleSendMessage(event, 'directConversation')}
						>
							<label className="field">
								<span>Message</span>
								<textarea
									value={directConversationMessageDraft}
									onChange={(event) => setDirectConversationMessageDraft(event.target.value)}
									placeholder={
										selectedDirectConversationCounterpart
											? `${selectedDirectConversationCounterpart.displayName}에게 메시지 보내기`
											: '좌측에서 DM을 선택하세요'
									}
									rows={4}
									maxLength={4000}
									disabled={!session || !selectedDirectConversation || isMessageSending}
								/>
							</label>
							<div className="composer-actions">
								<small>{directConversationMessageDraft.trim().length}/4000</small>
								<button
									className="primary-button secondary-tone"
									type="submit"
									disabled={
										!session ||
										!selectedDirectConversation ||
										isMessageSending ||
										!directConversationMessageDraft.trim()
									}
								>
									{isMessageSending ? 'Sending...' : 'Send DM'}
								</button>
							</div>
						</form>
					</section>

					<div className="panel-grid">
						<section className="auth-card">
							<div className="card-heading">
								<span className="card-kicker">Authentication</span>
								<h3>{session ? 'Signed in' : 'Sign in'}</h3>
							</div>

							{isSessionLoading ? (
								<p className="helper-text">기존 세션을 확인하는 중입니다...</p>
							) : session ? (
								<div className="session-stack">
									<div className="session-summary">
										<span>Current user</span>
										<strong>{userEmail}</strong>
										<small>User ID: {session.user.id}</small>
									</div>
									<button
										className="primary-button secondary-tone"
										type="button"
										onClick={() => void handleLogout()}
										disabled={isAuthLoading}
									>
										{isAuthLoading ? 'Signing out...' : 'Log out'}
									</button>
								</div>
							) : (
								<form className="auth-form" onSubmit={(event) => void handleLogin(event)}>
									<label className="field">
										<span>Email</span>
										<input
											type="email"
											autoComplete="email"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
											placeholder="alice@company.com"
											required
										/>
									</label>

									<label className="field">
										<span>Password</span>
										<input
											type="password"
											autoComplete="current-password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Enter your password"
											required
										/>
									</label>

									<button className="primary-button" type="submit" disabled={isAuthLoading}>
										{isAuthLoading ? 'Signing in...' : 'Log in'}
									</button>
								</form>
							)}

							{authError ? <p className="error-message">{authError}</p> : null}
						</section>

						<aside className="status-card">
							<span>API Health</span>
							<strong>{health?.status ?? 'disconnected'}</strong>
							<small>{lastSeen}</small>
							<div className="status-divider" />
							<span>Session Status</span>
							<strong>{isSessionLoading ? 'checking' : session ? 'authenticated' : 'signed out'}</strong>
							<small>
								{session
									? '채널 목록 API에 access token을 붙여 보호된 요청까지 연결된 상태입니다.'
									: '로그인 후 채널, DM, 메시지 화면을 이어서 구성할 수 있습니다.'}
							</small>
						</aside>
					</div>
				</div>
			</section>
		</main>
	);
}

export default App;
