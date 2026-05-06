import type { FormEvent } from 'react';
import { MessageActionsMenu } from '@/components/chat/message-actions-menu';
import { MessageEditForm } from '@/components/chat/message-edit-form';
import type { MessageItem } from '@/types/chat';

const messageTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

type MessageRowProps = {
	editingDraft: string;
	isEditing: boolean;
	isMine: boolean;
	isMutating: boolean;
	message: MessageItem;
	onCancelEditMessage: () => void;
	onDeleteMessage: (message: MessageItem) => void;
	onEditingDraftChange: (draft: string) => void;
	onStartEditMessage: (message: MessageItem) => void;
	onUpdateMessage: (event: FormEvent<HTMLFormElement>, message: MessageItem) => void;
};

export function MessageRow({
	editingDraft,
	isEditing,
	isMine,
	isMutating,
	message,
	onCancelEditMessage,
	onDeleteMessage,
	onEditingDraftChange,
	onStartEditMessage,
	onUpdateMessage
}: MessageRowProps) {
	const canMutate = isMine && !message.deletedAt;

	return (
		<article className={`message-row${isMine ? ' message-row-mine' : ''}`}>
			<div className="member-avatar message-avatar" aria-hidden="true">
				{message.author.displayName.slice(0, 1).toUpperCase()}
			</div>
			<div className="message-bubble">
				<div className="message-meta">
					<strong>{message.author.displayName}</strong>
					<span>{messageTimeFormatter.format(new Date(message.createdAt))}</span>
				</div>
				{isEditing ? (
					<MessageEditForm
						draft={editingDraft}
						isMutating={isMutating}
						onCancel={onCancelEditMessage}
						onDraftChange={onEditingDraftChange}
						onSubmit={(event) => onUpdateMessage(event, message)}
					/>
				) : (
					<p>{message.deletedAt ? '삭제된 메시지입니다.' : message.content}</p>
				)}
				{canMutate && !isEditing ? (
					<MessageActionsMenu
						isMutating={isMutating}
						onDelete={() => onDeleteMessage(message)}
						onEdit={() => onStartEditMessage(message)}
					/>
				) : null}
			</div>
		</article>
	);
}
