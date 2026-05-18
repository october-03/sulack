import { apiRequest } from '@/api/http';
import type { ChannelItem, ChannelMemberItem, CreateChannelPayload } from '@/types/chat';

type ChannelListResponse = {
	channels: ChannelItem[];
};

type ChannelResponse = {
	channel: ChannelItem;
};

type ChannelMemberListResponse = {
	members: ChannelMemberItem[];
};

export async function getChannels(accessToken: string, signal?: AbortSignal) {
	const data = await apiRequest<ChannelListResponse>('/channels', {
		accessToken,
		signal
	});

	return data.channels;
}

export async function discoverChannels(accessToken: string, signal?: AbortSignal) {
	const data = await apiRequest<ChannelListResponse>('/channels/discover', {
		accessToken,
		signal
	});

	return data.channels;
}

export async function createChannel(accessToken: string, payload: CreateChannelPayload) {
	const data = await apiRequest<ChannelResponse>('/channels', {
		accessToken,
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'application/json'
		},
		method: 'POST'
	});

	return data.channel;
}

export async function joinPublicChannel(accessToken: string, channelId: string) {
	const data = await apiRequest<ChannelResponse>(`/channels/${channelId}/join`, {
		accessToken,
		method: 'POST'
	});

	return data.channel;
}

export async function getChannelMembers(accessToken: string, channelId: string, signal?: AbortSignal) {
	const data = await apiRequest<ChannelMemberListResponse>(`/channels/${channelId}/members`, {
		accessToken,
		signal
	});

	return data.members;
}

export async function addChannelMember(accessToken: string, channelId: string, userId: string) {
	const data = await apiRequest<ChannelResponse>(`/channels/${channelId}/members`, {
		accessToken,
		body: JSON.stringify({ userId }),
		headers: {
			'Content-Type': 'application/json'
		},
		method: 'POST'
	});

	return data.channel;
}
