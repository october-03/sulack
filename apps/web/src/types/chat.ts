export type ChannelItem = {
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

export type CreateChannelPayload = {
	name: string;
	description?: string;
	visibility: 'public' | 'private';
};

export type DirectConversationParticipant = {
	id: string;
	email: string;
	displayName: string;
	avatarUrl: string | null;
	statusMessage: string | null;
	joinedAt: string;
};

export type DirectConversationItem = {
	id: string;
	createdAt: string;
	participants: DirectConversationParticipant[];
};

export type SearchProfileItem = {
	id: string;
	email: string;
	displayName: string;
	avatarUrl: string | null;
	statusMessage: string | null;
};

export type MessageItem = {
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

export type MessageTarget = 'channel' | 'directConversation';
