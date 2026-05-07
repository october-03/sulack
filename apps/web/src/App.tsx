import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { createChannel, discoverChannels, joinPublicChannel } from '@/api/channels';
import { createDirectConversation } from '@/api/direct-conversations';
import { searchProfiles } from '@/api/profiles';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatPanel } from '@/components/chat/chat-panel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useChatSelection } from '@/hooks/use-chat-selection';
import { useMessageThread } from '@/hooks/use-message-thread';
import { useSessionProfile } from '@/hooks/use-session-profile';
import { useWorkspaceData } from '@/hooks/use-workspace-data';
import type { CreateChannelPayload } from '@/types/chat';

function App() {
	const navigate = useNavigate();
	const location = useLocation();
	const { channelId = null, conversationId = null } = useParams<{
		channelId?: string;
		conversationId?: string;
	}>();
	const { authError, isAuthLoading, isSessionLoading, logout, session } = useAuthSession();
	const {
		channelError,
		channels,
		directConversationError,
		directConversations,
		isChannelsLoading,
		isDirectConversationsLoading,
		refreshChannels,
		refreshDirectConversations
	} = useWorkspaceData(session, isSessionLoading);
	const channelThread = useMessageThread({
		session,
		target: 'channel',
		targetId: channelId
	});
	const directConversationThread = useMessageThread({
		session,
		target: 'directConversation',
		targetId: conversationId
	});
	const { profileEmail, profileInitial, profileName } = useSessionProfile(session);
	const {
		directConversationItems,
		selectedChannel,
		selectedDirectConversation,
		selectedDirectConversationCounterpart
	} = useChatSelection({
		channelId,
		channels,
		conversationId,
		currentUserId: session?.user.id ?? null,
		directConversations
	});

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

	const handleCreateChannel = useCallback(
		async (payload: CreateChannelPayload) => {
			if (!session) {
				throw new Error('로그인이 필요합니다.');
			}

			const channel = await createChannel(session.access_token, payload);
			await refreshChannels();
			navigate(`/channels/${channel.id}`);
			return channel;
		},
		[navigate, refreshChannels, session]
	);

	const handleDiscoverChannels = useCallback(async () => {
		if (!session) {
			throw new Error('로그인이 필요합니다.');
		}

		return discoverChannels(session.access_token);
	}, [session]);

	const handleJoinChannel = useCallback(
		async (channelIdToJoin: string) => {
			if (!session) {
				throw new Error('로그인이 필요합니다.');
			}

			const channel = await joinPublicChannel(session.access_token, channelIdToJoin);
			await refreshChannels();
			navigate(`/channels/${channel.id}`);
			return channel;
		},
		[navigate, refreshChannels, session]
	);

	const handleSearchProfiles = useCallback(
		async (query: string) => {
			if (!session) {
				throw new Error('로그인이 필요합니다.');
			}

			return searchProfiles(session.access_token, query);
		},
		[session]
	);

	const handleCreateDirectConversation = useCallback(
		async (userId: string) => {
			if (!session) {
				throw new Error('로그인이 필요합니다.');
			}

			const conversation = await createDirectConversation(session.access_token, userId);
			await refreshDirectConversations();
			navigate(`/dms/${conversation.id}`);
			return conversation;
		},
		[navigate, refreshDirectConversations, session]
	);

	const handleLogout = async () => {
		if (await logout()) {
			navigate('/login', { replace: true });
		}
	};

	return (
		<SidebarProvider>
			<AppSidebar
				authError={authError}
				channelError={channelError}
				channels={channels}
				directConversationError={directConversationError}
				directConversations={directConversationItems}
				isAuthLoading={isAuthLoading}
				isChannelLoading={isChannelsLoading}
				isDirectConversationLoading={isDirectConversationsLoading}
				isSessionLoading={isSessionLoading}
				profileEmail={profileEmail}
				profileInitial={profileInitial}
				profileName={profileName}
				selectedChannelId={channelId}
				selectedDirectConversationId={conversationId}
				onLogout={() => void handleLogout()}
				onCreateChannel={handleCreateChannel}
				onCreateDirectConversation={handleCreateDirectConversation}
				onDiscoverChannels={handleDiscoverChannels}
				onJoinChannel={handleJoinChannel}
				onSearchProfiles={handleSearchProfiles}
				onSelectChannel={handleSelectChannel}
				onSelectDirectConversation={handleSelectDirectConversation}
			/>

			<ChatPanel
				channelThread={channelThread}
				currentUserId={session?.user.id ?? null}
				directConversationThread={directConversationThread}
				isAuthenticated={Boolean(session)}
				selectedChannel={selectedChannel}
				selectedDirectConversation={selectedDirectConversation}
				selectedDirectConversationCounterpart={selectedDirectConversationCounterpart}
			/>
		</SidebarProvider>
	);
}

export default App;
