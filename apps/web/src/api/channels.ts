import { apiRequest } from '@/api/http';
import type { ChannelItem } from '@/types/chat';

type ChannelListResponse = {
	channels: ChannelItem[];
};

export async function getChannels(accessToken: string, signal?: AbortSignal) {
	const data = await apiRequest<ChannelListResponse>('/channels', {
		accessToken,
		signal
	});

	return data.channels;
}
