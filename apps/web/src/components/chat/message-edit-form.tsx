import type { FormEvent } from 'react';

type MessageEditFormProps = {
	draft: string;
	isMutating: boolean;
	onCancel: () => void;
	onDraftChange: (draft: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MessageEditForm({ draft, isMutating, onCancel, onDraftChange, onSubmit }: MessageEditFormProps) {
	return (
		<form className="message-edit-form" onSubmit={onSubmit}>
			<textarea
				value={draft}
				onChange={(event) => onDraftChange(event.target.value)}
				rows={3}
				maxLength={4000}
				disabled={isMutating}
			/>
			<div className="message-actions">
				<small>{draft.trim().length}/4000</small>
				<div className="message-action-buttons">
					<button type="submit" disabled={isMutating || !draft.trim()}>
						Save
					</button>
					<button type="button" onClick={onCancel} disabled={isMutating}>
						Cancel
					</button>
				</div>
			</div>
		</form>
	);
}
