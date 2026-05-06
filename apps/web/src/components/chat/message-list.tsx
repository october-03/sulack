import type { FormEvent } from 'react';
import { MessageRow } from '@/components/chat/message-row';
import type { MessageItem } from '@/types/chat';

type MessageListProps = {
	ariaLabel: string;
	currentUserId: string | null;
	editingDraft: string;
	editingMessageId: string | null;
	emptyMessage: string;
	error: string | null;
	isLoading: boolean;
	isMutating: boolean;
	messages: MessageItem[];
	onCancelEditMessage: () => void;
	onDeleteMessage: (message: MessageItem) => void;
	onEditingDraftChange: (draft: string) => void;
	onStartEditMessage: (message: MessageItem) => void;
	onUpdateMessage: (event: FormEvent<HTMLFormElement>, message: MessageItem) => void;
};

export function MessageList({
	ariaLabel,
	currentUserId,
	editingDraft,
	editingMessageId,
	emptyMessage,
	error,
	isLoading,
	isMutating,
	messages,
	onCancelEditMessage,
	onDeleteMessage,
	onEditingDraftChange,
	onStartEditMessage,
	onUpdateMessage
}: MessageListProps) {
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
				const isMine = message.author.id === currentUserId;
				const isEditing = editingMessageId === message.id;

				return (
					<MessageRow
						key={message.id}
						editingDraft={editingDraft}
						isEditing={isEditing}
						isMine={isMine}
						isMutating={isMutating}
						message={message}
						onCancelEditMessage={onCancelEditMessage}
						onDeleteMessage={onDeleteMessage}
						onEditingDraftChange={onEditingDraftChange}
						onStartEditMessage={onStartEditMessage}
						onUpdateMessage={onUpdateMessage}
					/>
				);
			})}
		</div>
	);
}
