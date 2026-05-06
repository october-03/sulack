import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createMessage, deleteMessage, getMessages, updateMessage, upsertMessage } from '@/api/messages';
import { supabase } from '@/lib/supabase';
import type { MessageItem, MessageTarget } from '@/types/chat';

type UseMessageThreadOptions = {
	session: Session | null;
	target: MessageTarget;
	targetId: string | null;
};

export function useMessageThread({ session, target, targetId }: UseMessageThreadOptions) {
	const [messages, setMessages] = useState<MessageItem[]>([]);
	const [draft, setDraft] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [composerError, setComposerError] = useState<string | null>(null);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editingDraft, setEditingDraft] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const targetIdRef = useRef<string | null>(targetId);

	useEffect(() => {
		targetIdRef.current = targetId;
	}, [targetId]);

	const loadMessages = useCallback(
		async (options?: { signal?: AbortSignal; silent?: boolean }) => {
			if (!session || !targetId) {
				setMessages([]);
				setError(null);
				setIsLoading(false);
				return;
			}

			const requestedTargetId = targetId;

			if (!options?.silent) {
				setIsLoading(true);
			}
			setError(null);

			try {
				const nextMessages = await getMessages(session.access_token, target, requestedTargetId, options?.signal);

				if (targetIdRef.current !== requestedTargetId) {
					return;
				}

				setMessages(nextMessages);
			} catch (loadError) {
				if (loadError instanceof DOMException && loadError.name === 'AbortError') {
					return;
				}

				if (!options?.silent) {
					setMessages([]);
				}
				setError(loadError instanceof Error ? messageLoadError(target, loadError.message) : messageLoadError(target));
			} finally {
				if (!options?.silent) {
					setIsLoading(false);
				}
			}
		},
		[session, target, targetId]
	);

	useEffect(() => {
		const abortController = new AbortController();

		void loadMessages({ signal: abortController.signal });

		return () => {
			abortController.abort();
		};
	}, [loadMessages]);

	useEffect(() => {
		if (!session || !targetId) {
			return;
		}

		supabase.realtime.setAuth(session.access_token);

		const filter = target === 'channel' ? `channel_id=eq.${targetId}` : `conversation_id=eq.${targetId}`;
		const realtimeChannel = supabase
			.channel(`messages:${target}:${targetId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter
				},
				() => {
					void loadMessages({ silent: true });
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'messages',
					filter
				},
				() => {
					void loadMessages({ silent: true });
				}
			)
			.subscribe((status) => {
				if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
					setError(
						target === 'channel'
							? '채널 메시지 실시간 구독이 끊겼습니다. 잠시 후 다시 시도해주세요.'
							: 'DM 메시지 실시간 구독이 끊겼습니다. 잠시 후 다시 시도해주세요.'
					);
				}
			});

		return () => {
			void supabase.removeChannel(realtimeChannel);
		};
	}, [loadMessages, session, target, targetId]);

	const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!session) {
			setComposerError('로그인 후 메시지를 보낼 수 있습니다.');
			return;
		}

		if (!targetId) {
			setComposerError(
				target === 'channel' ? '메시지를 보낼 채널을 선택해주세요.' : '메시지를 보낼 DM을 선택해주세요.'
			);
			return;
		}

		const content = draft.trim();

		if (!content) {
			setComposerError('메시지 내용을 입력해주세요.');
			return;
		}

		setIsSending(true);
		setComposerError(null);

		try {
			const message = await createMessage(session.access_token, target, targetId, content);
			setDraft('');
			setMessages((currentMessages) => upsertMessage(currentMessages, message));
		} catch (sendError) {
			setComposerError(
				sendError instanceof Error
					? `메시지를 보내지 못했습니다. (${sendError.message})`
					: '메시지를 보내지 못했습니다.'
			);
		} finally {
			setIsSending(false);
		}
	};

	const applyMessageResponse = (message: MessageItem) => {
		setMessages((currentMessages) => upsertMessage(currentMessages, message));
	};

	const startEditMessage = (message: MessageItem) => {
		setEditingMessageId(message.id);
		setEditingDraft(message.content);
		setComposerError(null);
	};

	const cancelEditMessage = () => {
		setEditingMessageId(null);
		setEditingDraft('');
	};

	const submitMessageEdit = async (event: FormEvent<HTMLFormElement>, message: MessageItem) => {
		event.preventDefault();

		if (!session) {
			setComposerError('로그인 후 메시지를 수정할 수 있습니다.');
			return;
		}

		const content = editingDraft.trim();

		if (!content) {
			setComposerError('수정할 메시지 내용을 입력해주세요.');
			return;
		}

		setIsMutating(true);
		setComposerError(null);

		try {
			applyMessageResponse(await updateMessage(session.access_token, message.id, content));
			cancelEditMessage();
		} catch (updateError) {
			setComposerError(
				updateError instanceof Error
					? `메시지를 수정하지 못했습니다. (${updateError.message})`
					: '메시지를 수정하지 못했습니다.'
			);
		} finally {
			setIsMutating(false);
		}
	};

	const removeMessage = async (message: MessageItem) => {
		if (!session) {
			setComposerError('로그인 후 메시지를 삭제할 수 있습니다.');
			return;
		}

		if (!window.confirm('이 메시지를 삭제할까요?')) {
			return;
		}

		setIsMutating(true);
		setComposerError(null);

		try {
			applyMessageResponse(await deleteMessage(session.access_token, message.id));
			setEditingMessageId((currentEditingMessageId) =>
				currentEditingMessageId === message.id ? null : currentEditingMessageId
			);
		} catch (deleteError) {
			setComposerError(
				deleteError instanceof Error
					? `메시지를 삭제하지 못했습니다. (${deleteError.message})`
					: '메시지를 삭제하지 못했습니다.'
			);
		} finally {
			setIsMutating(false);
		}
	};

	return {
		cancelEditMessage,
		composerError,
		draft,
		editingDraft,
		editingMessageId,
		error,
		isLoading,
		isMutating,
		isSending,
		messages,
		removeMessage,
		sendMessage,
		setDraft,
		setEditingDraft,
		startEditMessage,
		submitMessageEdit
	};
}

function messageLoadError(target: MessageTarget, status?: string) {
	const label = target === 'channel' ? '채널 메시지' : 'DM 메시지';
	return status ? `${label}를 불러오지 못했습니다. (${status})` : `${label}를 불러오지 못했습니다.`;
}
