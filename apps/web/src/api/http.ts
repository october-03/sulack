const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type ApiRequestOptions = RequestInit & {
	accessToken: string;
};

export async function apiRequest<TResponse>(path: string, { accessToken, headers, ...init }: ApiRequestOptions) {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			...headers
		}
	});

	if (!response.ok) {
		throw new Error(`${response.status}`);
	}

	return (await response.json()) as TResponse;
}
