import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { MoreVertical, SendHorizontal } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { AppSidebar } from '@/components/app-sidebar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from './lib/supabase';

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
	const navigate = useNavigate();
	const location = useLocation();
	const { channelId, conversationId } = useParams<{
		channelId?: string;
		conversationId?: string;
	}>();
	const [session, setSession] = useState<Session | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);
	const [channels, setChannels] = useState<ChannelItem[]>([]);
	const [channelError, setChannelError] = useState<string | null>(null);
	const [directConversations, setDirectConversations] = useState<DirectConversationItem[]>([]);
	const [directConversationError, setDirectConversationError] = useState<string | null>(null);
	const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
	const [selectedDirectConversationId, setSelectedDirectConversationId] = useState<string | null>(null);
	const [channelMessageDraft, setChannelMessageDraft] = useState('');
	const [directConversationMessageDraft, setDirectConversationMessageDraft] = useState('');
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editingMessageDraft, setEditingMessageDraft] = useState('');
	const [messageComposerError, setMessageComposerError] = useState<string | null>(null);
	const [channelMessages, setChannelMessages] = useState<MessageItem[]>([]);
	const [directConversationMessages, setDirectConversationMessages] = useState<MessageItem[]>([]);
	const [channelMessagesError, setChannelMessagesError] = useState<string | null>(null);
	const [directConversationMessagesError, setDirectConversationMessagesError] = useState<string | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [isSessionLoading, setIsSessionLoading] = useState(true);
	const [isChannelsLoading, setIsChannelsLoading] = useState(false);
	const [isDirectConversationsLoading, setIsDirectConversationsLoading] = useState(false);
	const [isMessageSending, setIsMessageSending] = useState(false);
	const [isMessageMutating, setIsMessageMutating] = useState(false);
	const [isChannelMessagesLoading, setIsChannelMessagesLoading] = useState(false);
	const [isDirectConversationMessagesLoading, setIsDirectConversationMessagesLoading] = useState(false);
	const selectedChannelIdRef = useRef<string | null>(null);
	const selectedDirectConversationIdRef = useRef<string | null>(null);
	const chatScrollRef = useRef<HTMLDivElement | null>(null);

	const scrollChatToBottom = useCallback(() => {
		if (!chatScrollRef.current) {
			return;
		}

		chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
	}, []);

	useEffect(() => {
		if (!isSessionLoading && !session) {
			navigate('/login', {
				replace: true,
				state: {
					from: location.pathname
				}
			});
		}
	}, [isSessionLoading, location.pathname, navigate, session]);

	useEffect(() => {
		if (channelId) {
			setSelectedChannelId(channelId);
			setSelectedDirectConversationId(null);
			return;
		}

		if (conversationId) {
			setSelectedDirectConversationId(conversationId);
			setSelectedChannelId(null);
			return;
		}

		setSelectedChannelId(null);
		setSelectedDirectConversationId(null);
	}, [channelId, conversationId]);

	const handleSelectChannel = useCallback(
		(nextChannelId: string) => {
			navigate(`/channels/${nextChannelId}`);
		},
		[navigate]
	);

	const handleSelectDirectConversation = useCallback(
		(nextConversationId: string) => {
			navigate(`/dms/${nextConversationId}`);
		},
		[navigate]
	);

	useEffect(() => {
		selectedChannelIdRef.current = selectedChannelId;
	}, [selectedChannelId]);

	useEffect(() => {
		selectedDirectConversationIdRef.current = selectedDirectConversationId;
	}, [selectedDirectConversationId]);

	useEffect(() => {
		if (!selectedChannelId) {
			return;
		}

		scrollChatToBottom();
	}, [channelMessages, selectedChannelId, scrollChatToBottom]);

	useEffect(() => {
		if (!selectedDirectConversationId) {
			return;
		}

		scrollChatToBottom();
	}, [directConversationMessages, selectedDirectConversationId, scrollChatToBottom]);

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
		if (isSessionLoading) {
			return;
		}

		if (!session) {
			setChannels([]);
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
			setDirectConversationError(null);
			setChannelMessagesError(null);
			setDirectConversationMessagesError(null);
			setMessageComposerError(null);
			setIsChannelsLoading(false);
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
	}, [isSessionLoading, session]);

	useEffect(() => {
		if (isSessionLoading) {
			return;
		}

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
	}, [isSessionLoading, session]);

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

	const handleLogout = async () => {
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await supabase.auth.signOut();

		if (error) {
			setAuthError(error.message);
			setIsAuthLoading(false);
			return;
		}

		navigate('/login', { replace: true });
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
			} else {
				console.info('[Messages] direct conversation message sent', {
					selectedDirectConversationId,
					responseConversationId: data.message.conversationId,
					messageId: data.message.id
				});
				setDirectConversationMessageDraft('');
				setDirectConversationMessages((currentMessages) => upsertMessage(currentMessages, data.message));
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
		} catch (error) {
			setMessageComposerError(error instanceof Error ? error.message : '메시지를 삭제하지 못했습니다.');
		} finally {
			setIsMessageMutating(false);
		}
	};

	const profileEmail = session?.user.email ?? 'unknown user';
	const profileMetadataDisplayName = session?.user.user_metadata?.display_name;
	const profileName =
		typeof profileMetadataDisplayName === 'string' && profileMetadataDisplayName.trim()
			? profileMetadataDisplayName
			: profileEmail.split('@')[0];
	const profileInitial = profileName.slice(0, 1).toUpperCase();
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
	const currentPageLabel = selectedChannel
		? selectedChannel.name
		: selectedDirectConversationCounterpart
			? selectedDirectConversationCounterpart.displayName
			: 'Overview';
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
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button className="message-menu-trigger" type="button" disabled={isMessageMutating}>
												<MoreVertical />
												<span className="sr-only">Message actions</span>
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => handleStartEditMessage(message)}>Edit</DropdownMenuItem>
											<DropdownMenuItem variant="destructive" onClick={() => void handleDeleteMessage(message)}>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								) : null}
							</div>
						</article>
					);
				})}
			</div>
		);
	};
	return (
		<SidebarProvider>
			<AppSidebar
				authError={authError}
				channelError={channelError}
				channels={channels}
				directConversationError={directConversationError}
				directConversations={directConversationItems.map(({ conversation, label }) => ({
					id: conversation.id,
					label
				}))}
				isAuthLoading={isAuthLoading}
				isChannelLoading={isChannelsLoading}
				isDirectConversationLoading={isDirectConversationsLoading}
				isSessionLoading={isSessionLoading}
				profileEmail={profileEmail}
				profileInitial={profileInitial}
				profileName={profileName}
				selectedChannelId={selectedChannelId}
				selectedDirectConversationId={selectedDirectConversationId}
				onLogout={() => void handleLogout()}
				onSelectChannel={handleSelectChannel}
				onSelectDirectConversation={handleSelectDirectConversation}
			/>

			<SidebarInset className="chat-layout">
				<header className="flex h-16 shrink-0 items-center gap-2 border-b">
					<div className="flex min-w-0 flex-1 items-center gap-2 px-3">
						<SidebarTrigger />
						<Separator orientation="vertical" className="mr-2 h-4" />
						<div className="min-w-0">
							<h1 className="truncate text-base font-semibold">{currentPageLabel}</h1>
							<p className="truncate text-xs text-muted-foreground">
								{selectedChannel
									? `${selectedChannel.memberCount} members`
									: selectedDirectConversation
										? 'Direct message'
										: 'Select a conversation'}
							</p>
						</div>
					</div>
				</header>
				<section className="chat-screen">
					<div className="chat-scroll" ref={chatScrollRef}>
						{selectedChannel
							? renderMessageList(
									channelMessages,
									isChannelMessagesLoading,
									channelMessagesError,
									'아직 채널 메시지가 없습니다.',
									'Channel messages'
								)
							: null}
						{selectedDirectConversation
							? renderMessageList(
									directConversationMessages,
									isDirectConversationMessagesLoading,
									directConversationMessagesError,
									'아직 DM 메시지가 없습니다.',
									'Direct conversation messages'
								)
							: null}
						{session && !selectedChannel && !selectedDirectConversation ? (
							<div className="chat-empty-state">
								<strong>대화를 선택해주세요.</strong>
								<span>왼쪽 사이드바에서 채널이나 DM을 선택하면 메시지가 표시됩니다.</span>
							</div>
						) : null}
					</div>

					<div className="chat-composer">
						{selectedChannel ? (
							<form className="message-composer-form" onSubmit={(event) => void handleSendMessage(event, 'channel')}>
								<div className="chat-editor">
									<label className="chat-editor-body">
										<span className="sr-only">Message</span>
										<textarea
											value={channelMessageDraft}
											onChange={(event) => setChannelMessageDraft(event.target.value)}
											placeholder={`#${selectedChannel.name}에 메시지 보내기`}
											rows={3}
											maxLength={4000}
											disabled={!session || isMessageSending}
										/>
									</label>
									<button
										className="chat-send-button"
										type="submit"
										disabled={!session || isMessageSending || !channelMessageDraft.trim()}
										aria-label="Send channel message"
									>
										<SendHorizontal />
									</button>
								</div>
							</form>
						) : null}

						{selectedDirectConversation ? (
							<form
								className="message-composer-form"
								onSubmit={(event) => void handleSendMessage(event, 'directConversation')}
							>
								<div className="chat-editor">
									<label className="chat-editor-body">
										<span className="sr-only">Message</span>
										<textarea
											value={directConversationMessageDraft}
											onChange={(event) => setDirectConversationMessageDraft(event.target.value)}
											placeholder={
												selectedDirectConversationCounterpart
													? `${selectedDirectConversationCounterpart.displayName}에게 메시지 보내기`
													: '메시지 보내기'
											}
											rows={3}
											maxLength={4000}
											disabled={!session || isMessageSending}
										/>
									</label>
									<button
										className="chat-send-button"
										type="submit"
										disabled={!session || isMessageSending || !directConversationMessageDraft.trim()}
										aria-label="Send direct message"
									>
										<SendHorizontal />
									</button>
								</div>
							</form>
						) : null}

						{messageComposerError ? <p className="error-message">{messageComposerError}</p> : null}
					</div>
				</section>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default App;
