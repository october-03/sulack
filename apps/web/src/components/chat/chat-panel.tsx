import { useEffect, useRef } from 'react';
import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageComposer } from '@/components/chat/message-composer';
import { MessageList } from '@/components/chat/message-list';
import { SidebarInset } from '@/components/ui/sidebar';
import type { useMessageThread } from '@/hooks/use-message-thread';
import type {
	ChannelItem,
	ChannelMemberItem,
	DirectConversationItem,
	DirectConversationParticipant,
	SearchProfileItem
} from '@/types/chat';

type MessageThread = ReturnType<typeof useMessageThread>;

type ChatPanelProps = {
	channelThread: MessageThread;
	currentUserId: string | null;
	directConversationThread: MessageThread;
	isAuthenticated: boolean;
	onAddChannelMember: (channelId: string, userId: string) => Promise<ChannelItem>;
	onGetChannelMembers: (channelId: string, signal?: AbortSignal) => Promise<ChannelMemberItem[]>;
	onSearchProfiles: (query: string) => Promise<SearchProfileItem[]>;
	selectedChannel: ChannelItem | null;
	selectedDirectConversation: DirectConversationItem | null;
	selectedDirectConversationCounterpart: DirectConversationParticipant | null;
};

export function ChatPanel({
	channelThread,
	currentUserId,
	directConversationThread,
	isAuthenticated,
	onAddChannelMember,
	onGetChannelMembers,
	onSearchProfiles,
	selectedChannel,
	selectedDirectConversation,
	selectedDirectConversationCounterpart
}: ChatPanelProps) {
	const chatScrollRef = useRef<HTMLDivElement | null>(null);
	const currentPageLabel = selectedChannel
		? selectedChannel.name
		: selectedDirectConversationCounterpart
			? selectedDirectConversationCounterpart.displayName
			: 'Overview';
	const headerVariant = selectedChannel ? 'channel' : selectedDirectConversation ? 'directConversation' : 'empty';

	useEffect(() => {
		if (!selectedChannel && !selectedDirectConversation) {
			return;
		}

		chatScrollRef.current?.scrollTo({
			top: chatScrollRef.current.scrollHeight
		});
	}, [selectedChannel, selectedDirectConversation, channelThread.messages, directConversationThread.messages]);

	return (
		<SidebarInset className="chat-layout">
			<ChatHeader
				memberCount={selectedChannel?.memberCount}
				onAddChannelMember={onAddChannelMember}
				onGetChannelMembers={onGetChannelMembers}
				onSearchProfiles={onSearchProfiles}
				participants={selectedDirectConversation?.participants}
				selectedChannel={selectedChannel}
				title={currentPageLabel}
				variant={headerVariant}
			/>
			<section className="chat-screen">
				<div className="chat-scroll" ref={chatScrollRef}>
					{selectedChannel ? (
						<MessageList
							ariaLabel="Channel messages"
							currentUserId={currentUserId}
							editingDraft={channelThread.editingDraft}
							editingMessageId={channelThread.editingMessageId}
							emptyMessage="아직 채널 메시지가 없습니다."
							error={channelThread.error}
							isLoading={channelThread.isLoading}
							isMutating={channelThread.isMutating}
							messages={channelThread.messages}
							onCancelEditMessage={channelThread.cancelEditMessage}
							onDeleteMessage={(message) => void channelThread.removeMessage(message)}
							onEditingDraftChange={channelThread.setEditingDraft}
							onStartEditMessage={channelThread.startEditMessage}
							onUpdateMessage={(event, message) => void channelThread.submitMessageEdit(event, message)}
						/>
					) : null}
					{selectedDirectConversation ? (
						<MessageList
							ariaLabel="Direct conversation messages"
							currentUserId={currentUserId}
							editingDraft={directConversationThread.editingDraft}
							editingMessageId={directConversationThread.editingMessageId}
							emptyMessage="아직 DM 메시지가 없습니다."
							error={directConversationThread.error}
							isLoading={directConversationThread.isLoading}
							isMutating={directConversationThread.isMutating}
							messages={directConversationThread.messages}
							onCancelEditMessage={directConversationThread.cancelEditMessage}
							onDeleteMessage={(message) => void directConversationThread.removeMessage(message)}
							onEditingDraftChange={directConversationThread.setEditingDraft}
							onStartEditMessage={directConversationThread.startEditMessage}
							onUpdateMessage={(event, message) => void directConversationThread.submitMessageEdit(event, message)}
						/>
					) : null}
					{isAuthenticated && !selectedChannel && !selectedDirectConversation ? <ChatEmptyState /> : null}
				</div>

				<div className="chat-composer">
					{selectedChannel ? (
						<MessageComposer
							ariaLabel="Send channel message"
							disabled={!isAuthenticated}
							draft={channelThread.draft}
							isSending={channelThread.isSending}
							placeholder={`#${selectedChannel.name}에 메시지 보내기`}
							onDraftChange={channelThread.setDraft}
							onSubmit={(event) => void channelThread.sendMessage(event)}
						/>
					) : null}

					{selectedDirectConversation ? (
						<MessageComposer
							ariaLabel="Send direct message"
							disabled={!isAuthenticated}
							draft={directConversationThread.draft}
							isSending={directConversationThread.isSending}
							placeholder={
								selectedDirectConversationCounterpart
									? `${selectedDirectConversationCounterpart.displayName}에게 메시지 보내기`
									: '메시지 보내기'
							}
							onDraftChange={directConversationThread.setDraft}
							onSubmit={(event) => void directConversationThread.sendMessage(event)}
						/>
					) : null}

					{selectedChannel && channelThread.composerError ? (
						<p className="error-message">{channelThread.composerError}</p>
					) : null}
					{selectedDirectConversation && directConversationThread.composerError ? (
						<p className="error-message">{directConversationThread.composerError}</p>
					) : null}
				</div>
			</section>
		</SidebarInset>
	);
}
