import { FormEvent } from 'react';
import { SendHorizontal } from 'lucide-react';

type MessageComposerProps = {
	ariaLabel: string;
	disabled: boolean;
	draft: string;
	isSending: boolean;
	placeholder: string;
	onDraftChange: (draft: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function MessageComposer({
	ariaLabel,
	disabled,
	draft,
	isSending,
	placeholder,
	onDraftChange,
	onSubmit
}: MessageComposerProps) {
	return (
		<form className="message-composer-form" onSubmit={onSubmit}>
			<div className="chat-editor">
				<label className="chat-editor-body">
					<span className="sr-only">Message</span>
					<textarea
						value={draft}
						onChange={(event) => onDraftChange(event.target.value)}
						placeholder={placeholder}
						rows={3}
						maxLength={4000}
						disabled={disabled || isSending}
					/>
				</label>
				<button
					className="chat-send-button"
					type="submit"
					disabled={disabled || isSending || !draft.trim()}
					aria-label={ariaLabel}
				>
					<SendHorizontal />
				</button>
			</div>
		</form>
	);
}
