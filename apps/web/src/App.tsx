import { FormEvent, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

type HealthResponse = {
	status: string;
	timestamp: string;
};

type ChannelItem = {
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

type ChannelListResponse = {
	channels: ChannelItem[];
};

type ChannelMember = {
	user: {
		id: string;
		email: string;
		displayName: string;
		avatarUrl: string | null;
		statusMessage: string | null;
	};
	role: 'admin' | 'member';
	joinedAt: string;
};

type ChannelMembersResponse = {
	members: ChannelMember[];
};

type DirectConversationParticipant = {
	id: string;
	email: string;
	displayName: string;
	avatarUrl: string | null;
	statusMessage: string | null;
	joinedAt: string;
};

type DirectConversationItem = {
	id: string;
	createdAt: string;
	participants: DirectConversationParticipant[];
};

type DirectConversationListResponse = {
	conversations: DirectConversationItem[];
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const dmDateFormatter = new Intl.DateTimeFormat('ko-KR', {
	month: 'short',
	day: 'numeric'
});

function App() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [authError, setAuthError] = useState<string | null>(null);
	const [channels, setChannels] = useState<ChannelItem[]>([]);
	const [channelError, setChannelError] = useState<string | null>(null);
	const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
	const [directConversations, setDirectConversations] = useState<DirectConversationItem[]>([]);
	const [channelMembersError, setChannelMembersError] = useState<string | null>(null);
	const [directConversationError, setDirectConversationError] = useState<string | null>(null);
	const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
	const [selectedDirectConversationId, setSelectedDirectConversationId] = useState<string | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [isSessionLoading, setIsSessionLoading] = useState(true);
	const [isChannelsLoading, setIsChannelsLoading] = useState(false);
	const [isChannelMembersLoading, setIsChannelMembersLoading] = useState(false);
	const [isDirectConversationsLoading, setIsDirectConversationsLoading] = useState(false);

	useEffect(() => {
		void fetch(`${apiBaseUrl}/health`)
			.then(async (response) => response.json() as Promise<HealthResponse>)
			.then((data) => setHealth(data))
			.catch(() => setHealth(null));
	}, []);

	useEffect(() => {
		let isMounted = true;

		void supabase.auth.getSession().then(({ data, error }) => {
			if (!isMounted) {
				return;
			}

			setSession(data.session);
			setAuthError(error?.message ?? null);
			setIsSessionLoading(false);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
			setAuthError(null);
			setIsSessionLoading(false);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (!session) {
			setChannels([]);
			setChannelMembers([]);
			setDirectConversations([]);
			setSelectedChannelId(null);
			setSelectedDirectConversationId(null);
			setChannelError(null);
			setChannelMembersError(null);
			setDirectConversationError(null);
			setIsChannelsLoading(false);
			setIsChannelMembersLoading(false);
			setIsDirectConversationsLoading(false);
			return;
		}

		let isCancelled = false;

		const loadChannels = async () => {
			setIsChannelsLoading(true);
			setChannelError(null);

			try {
				const response = await fetch(`${apiBaseUrl}/channels`, {
					headers: {
						Authorization: `Bearer ${session.access_token}`
					}
				});

				if (!response.ok) {
					throw new Error(`채널 목록을 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as ChannelListResponse;

				if (isCancelled) {
					return;
				}

				setChannels(data.channels);
				setSelectedChannelId((currentSelectedChannelId) => {
					if (currentSelectedChannelId && data.channels.some((channel) => channel.id === currentSelectedChannelId)) {
						return currentSelectedChannelId;
					}

					return data.channels[0]?.id ?? null;
				});
			} catch (error) {
				if (isCancelled) {
					return;
				}

				setChannels([]);
				setSelectedChannelId(null);
				setChannelError(error instanceof Error ? error.message : '채널 목록을 불러오지 못했습니다.');
			} finally {
				if (!isCancelled) {
					setIsChannelsLoading(false);
				}
			}
		};

		void loadChannels();

		return () => {
			isCancelled = true;
		};
	}, [session]);

	useEffect(() => {
		if (!session) {
			setDirectConversations([]);
			setSelectedDirectConversationId(null);
			setDirectConversationError(null);
			setIsDirectConversationsLoading(false);
			return;
		}

		let isCancelled = false;

		const loadDirectConversations = async () => {
			setIsDirectConversationsLoading(true);
			setDirectConversationError(null);

			try {
				const response = await fetch(`${apiBaseUrl}/direct-conversations`, {
					headers: {
						Authorization: `Bearer ${session.access_token}`
					}
				});

				if (!response.ok) {
					throw new Error(`DM 목록을 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as DirectConversationListResponse;

				if (isCancelled) {
					return;
				}

				setDirectConversations(data.conversations);
				setSelectedDirectConversationId((currentSelectedDirectConversationId) => {
					if (
						currentSelectedDirectConversationId &&
						data.conversations.some((conversation) => conversation.id === currentSelectedDirectConversationId)
					) {
						return currentSelectedDirectConversationId;
					}

					return data.conversations[0]?.id ?? null;
				});
			} catch (error) {
				if (isCancelled) {
					return;
				}

				setDirectConversations([]);
				setSelectedDirectConversationId(null);
				setDirectConversationError(error instanceof Error ? error.message : 'DM 목록을 불러오지 못했습니다.');
			} finally {
				if (!isCancelled) {
					setIsDirectConversationsLoading(false);
				}
			}
		};

		void loadDirectConversations();

		return () => {
			isCancelled = true;
		};
	}, [session]);

	useEffect(() => {
		if (!session || !selectedChannelId) {
			setChannelMembers([]);
			setChannelMembersError(null);
			setIsChannelMembersLoading(false);
			return;
		}

		let isCancelled = false;

		const loadChannelMembers = async () => {
			setIsChannelMembersLoading(true);
			setChannelMembersError(null);

			try {
				const response = await fetch(`${apiBaseUrl}/channels/${selectedChannelId}/members`, {
					headers: {
						Authorization: `Bearer ${session.access_token}`
					}
				});

				if (!response.ok) {
					throw new Error(`채널 멤버를 불러오지 못했습니다. (${response.status})`);
				}

				const data = (await response.json()) as ChannelMembersResponse;

				if (isCancelled) {
					return;
				}

				setChannelMembers(data.members);
			} catch (error) {
				if (isCancelled) {
					return;
				}

				setChannelMembers([]);
				setChannelMembersError(error instanceof Error ? error.message : '채널 멤버를 불러오지 못했습니다.');
			} finally {
				if (!isCancelled) {
					setIsChannelMembersLoading(false);
				}
			}
		};

		void loadChannelMembers();

		return () => {
			isCancelled = true;
		};
	}, [selectedChannelId, session]);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			setAuthError(error.message);
		} else {
			setPassword('');
		}

		setIsAuthLoading(false);
	};

	const handleLogout = async () => {
		setIsAuthLoading(true);
		setAuthError(null);

		const { error } = await supabase.auth.signOut();

		if (error) {
			setAuthError(error.message);
		}

		setIsAuthLoading(false);
	};

	const userEmail = session?.user.email ?? 'unknown user';
	const lastSeen = health?.timestamp ?? 'Start the API server to see live status.';
	const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
	const selectedDirectConversation =
		directConversations.find((conversation) => conversation.id === selectedDirectConversationId) ?? null;
	const directConversationItems = directConversations.map((conversation) => {
		const counterpart =
			conversation.participants.find((participant) => participant.id !== session?.user.id) ??
			conversation.participants[0];

		return {
			conversation,
			counterpart,
			label: counterpart?.displayName ?? 'Unknown teammate'
		};
	});
	const selectedDirectConversationCounterpart =
		selectedDirectConversation?.participants.find((participant) => participant.id !== session?.user.id) ??
		selectedDirectConversation?.participants[0] ??
		null;

	return (
		<main className="workspace-shell">
			<aside className="sidebar">
				<div className="sidebar-header">
					<p className="eyebrow">Sulack</p>
					<h1>Channels</h1>
					<p className="sidebar-copy">
						{session
							? '공개 채널과 내가 접근 가능한 비공개 채널을 한눈에 확인할 수 있습니다.'
							: '로그인하면 채널 목록이 여기에 표시됩니다.'}
					</p>
				</div>

				<div className="sidebar-panel">
					<div className="sidebar-panel-heading">
						<span>Browse</span>
						<strong>{session ? `${channels.length} channels` : 'Sign in required'}</strong>
					</div>

					{isSessionLoading ? <p className="helper-text">세션을 확인하는 중입니다...</p> : null}
					{!isSessionLoading && !session ? (
						<p className="helper-text">좌측 채널 목록은 로그인 후 자동으로 불러옵니다.</p>
					) : null}
					{session && isChannelsLoading ? <p className="helper-text">채널 목록을 불러오는 중입니다...</p> : null}
					{session && channelError ? <p className="error-message">{channelError}</p> : null}
					{session && !isChannelsLoading && !channelError && channels.length === 0 ? (
						<p className="helper-text">아직 표시할 채널이 없습니다. API에서 첫 채널을 생성해보세요.</p>
					) : null}

					{session && channels.length > 0 ? (
						<div className="channel-list" role="list" aria-label="Channels">
							{channels.map((channel) => {
								const isSelected = channel.id === selectedChannelId;

								return (
									<button
										key={channel.id}
										type="button"
										className={`channel-card${isSelected ? ' channel-card-active' : ''}`}
										onClick={() => setSelectedChannelId(channel.id)}
									>
										<div className="channel-card-top">
											<div>
												<span className="channel-prefix">{channel.visibility === 'public' ? '#' : 'private'}</span>
												<strong>{channel.name}</strong>
											</div>
											<span className="channel-pill">{channel.membership?.role ?? 'guest'}</span>
										</div>
										<p>{channel.description ?? '채널 설명이 아직 없습니다.'}</p>
										<div className="channel-meta">
											<span>{channel.memberCount} members</span>
											<span>{channel.visibility}</span>
										</div>
									</button>
								);
							})}
						</div>
					) : null}
				</div>

				<div className="sidebar-panel">
					<div className="sidebar-panel-heading">
						<span>Direct Messages</span>
						<strong>{session ? `${directConversations.length} threads` : 'Sign in required'}</strong>
					</div>

					{isSessionLoading ? <p className="helper-text">세션을 확인하는 중입니다...</p> : null}
					{!isSessionLoading && !session ? (
						<p className="helper-text">로그인 후 현재 사용자의 1:1 DM 목록을 불러옵니다.</p>
					) : null}
					{session && isDirectConversationsLoading ? (
						<p className="helper-text">DM 목록을 불러오는 중입니다...</p>
					) : null}
					{session && directConversationError ? <p className="error-message">{directConversationError}</p> : null}
					{session && !isDirectConversationsLoading && !directConversationError && directConversations.length === 0 ? (
						<p className="helper-text">
							아직 시작한 1:1 DM이 없습니다. 사용자 검색과 DM 생성 흐름을 붙이면 여기에 표시됩니다.
						</p>
					) : null}

					{session && directConversations.length > 0 ? (
						<div className="dm-list" role="list" aria-label="Direct messages">
							{directConversationItems.map(({ conversation, counterpart, label }) => {
								const isSelected = conversation.id === selectedDirectConversationId;

								return (
									<button
										key={conversation.id}
										type="button"
										className={`dm-card${isSelected ? ' dm-card-active' : ''}`}
										onClick={() => setSelectedDirectConversationId(conversation.id)}
									>
										<div className="dm-card-top">
											<div className="member-avatar dm-avatar" aria-hidden="true">
												{label.slice(0, 1).toUpperCase()}
											</div>
											<div className="dm-copy">
												<strong>{label}</strong>
												<span>{counterpart?.email ?? 'No email available'}</span>
											</div>
											<span className="channel-pill">{dmDateFormatter.format(new Date(conversation.createdAt))}</span>
										</div>
										<p>{counterpart?.statusMessage ?? '대화를 시작할 준비가 된 동료입니다.'}</p>
									</button>
								);
							})}
						</div>
					) : null}
				</div>
			</aside>

			<section className="content-panel">
				<div className="hero">
					<p className="eyebrow">Supabase Auth</p>
					<h2>{selectedChannel ? selectedChannel.name : 'Sulack Access Portal'}</h2>
					<p className="description">
						{selectedChannel
							? (selectedChannel.description ??
								'채널 설명이 아직 없습니다. 이제 메시지 패널과 채널 상세 화면을 이어서 붙일 수 있습니다.')
							: '이메일 기반 로그인으로 세션을 유지하고, 보호된 API 요청에 access token을 연결하는 흐름을 확인할 수 있습니다.'}
					</p>

					{selectedChannel ? (
						<div className="channel-spotlight">
							<div className="spotlight-stat">
								<span>Visibility</span>
								<strong>{selectedChannel.visibility}</strong>
							</div>
							<div className="spotlight-stat">
								<span>Members</span>
								<strong>{selectedChannel.memberCount}</strong>
							</div>
							<div className="spotlight-stat">
								<span>My role</span>
								<strong>{selectedChannel.membership?.role ?? 'not joined'}</strong>
							</div>
						</div>
					) : null}

					<section className="members-panel">
						<div className="members-panel-heading">
							<div>
								<span className="card-kicker">Channel Members</span>
								<h3>{selectedChannel ? `${selectedChannel.name} members` : 'Select a channel'}</h3>
							</div>
							{selectedChannel ? <strong>{channelMembers.length}</strong> : null}
						</div>

						{!session ? <p className="helper-text">로그인 후 선택한 채널의 멤버 목록이 여기에 표시됩니다.</p> : null}
						{session && !selectedChannel ? (
							<p className="helper-text">좌측에서 채널을 선택하면 멤버 목록을 볼 수 있습니다.</p>
						) : null}
						{session && selectedChannel && isChannelMembersLoading ? (
							<p className="helper-text">채널 멤버를 불러오는 중입니다...</p>
						) : null}
						{session && selectedChannel && channelMembersError ? (
							<p className="error-message">{channelMembersError}</p>
						) : null}
						{session &&
						selectedChannel &&
						!isChannelMembersLoading &&
						!channelMembersError &&
						channelMembers.length === 0 ? (
							<p className="helper-text">아직 표시할 멤버가 없습니다.</p>
						) : null}

						{channelMembers.length > 0 ? (
							<div className="member-list" role="list" aria-label="Channel members">
								{channelMembers.map((member) => (
									<article key={member.user.id} className="member-card">
										<div className="member-card-top">
											<div className="member-avatar" aria-hidden="true">
												{member.user.displayName.slice(0, 1).toUpperCase()}
											</div>
											<div className="member-copy">
												<strong>{member.user.displayName}</strong>
												<span>{member.user.email}</span>
											</div>
											<span className="channel-pill">{member.role}</span>
										</div>
										<p>{member.user.statusMessage ?? '상태 메시지가 아직 없습니다.'}</p>
									</article>
								))}
							</div>
						) : null}
					</section>

					<section className="members-panel">
						<div className="members-panel-heading">
							<div>
								<span className="card-kicker">Direct Messages</span>
								<h3>{selectedDirectConversationCounterpart?.displayName ?? 'Select a DM'}</h3>
							</div>
							{selectedDirectConversation ? <strong>{selectedDirectConversation.participants.length}</strong> : null}
						</div>

						{!session ? <p className="helper-text">로그인 후 DM 목록과 상대방 정보를 확인할 수 있습니다.</p> : null}
						{session && isDirectConversationsLoading ? (
							<p className="helper-text">DM 목록을 불러오는 중입니다...</p>
						) : null}
						{session && !isDirectConversationsLoading && directConversationError ? (
							<p className="error-message">{directConversationError}</p>
						) : null}
						{session &&
						!isDirectConversationsLoading &&
						!directConversationError &&
						directConversations.length === 0 ? (
							<p className="helper-text">기존 DM이 생기면 이 패널에서 상대방 정보를 빠르게 확인할 수 있습니다.</p>
						) : null}

						{selectedDirectConversation && selectedDirectConversationCounterpart ? (
							<article className="member-card dm-detail-card">
								<div className="member-card-top">
									<div className="member-avatar member-avatar-large" aria-hidden="true">
										{selectedDirectConversationCounterpart.displayName.slice(0, 1).toUpperCase()}
									</div>
									<div className="member-copy">
										<strong>{selectedDirectConversationCounterpart.displayName}</strong>
										<span>{selectedDirectConversationCounterpart.email}</span>
									</div>
									<span className="channel-pill">1:1 DM</span>
								</div>
								<p>{selectedDirectConversationCounterpart.statusMessage ?? '아직 상태 메시지가 없습니다.'}</p>
								<div className="channel-meta">
									<span>Started {dmDateFormatter.format(new Date(selectedDirectConversation.createdAt))}</span>
									<span>{selectedDirectConversation.id.slice(0, 8)}</span>
								</div>
							</article>
						) : null}
					</section>

					<div className="panel-grid">
						<section className="auth-card">
							<div className="card-heading">
								<span className="card-kicker">Authentication</span>
								<h3>{session ? 'Signed in' : 'Sign in'}</h3>
							</div>

							{isSessionLoading ? (
								<p className="helper-text">기존 세션을 확인하는 중입니다...</p>
							) : session ? (
								<div className="session-stack">
									<div className="session-summary">
										<span>Current user</span>
										<strong>{userEmail}</strong>
										<small>User ID: {session.user.id}</small>
									</div>
									<button
										className="primary-button secondary-tone"
										type="button"
										onClick={() => void handleLogout()}
										disabled={isAuthLoading}
									>
										{isAuthLoading ? 'Signing out...' : 'Log out'}
									</button>
								</div>
							) : (
								<form className="auth-form" onSubmit={(event) => void handleLogin(event)}>
									<label className="field">
										<span>Email</span>
										<input
											type="email"
											autoComplete="email"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
											placeholder="alice@company.com"
											required
										/>
									</label>

									<label className="field">
										<span>Password</span>
										<input
											type="password"
											autoComplete="current-password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Enter your password"
											required
										/>
									</label>

									<button className="primary-button" type="submit" disabled={isAuthLoading}>
										{isAuthLoading ? 'Signing in...' : 'Log in'}
									</button>
								</form>
							)}

							{authError ? <p className="error-message">{authError}</p> : null}
						</section>

						<aside className="status-card">
							<span>API Health</span>
							<strong>{health?.status ?? 'disconnected'}</strong>
							<small>{lastSeen}</small>
							<div className="status-divider" />
							<span>Session Status</span>
							<strong>{isSessionLoading ? 'checking' : session ? 'authenticated' : 'signed out'}</strong>
							<small>
								{session
									? '채널 목록 API에 access token을 붙여 보호된 요청까지 연결된 상태입니다.'
									: '로그인 후 채널, DM, 메시지 화면을 이어서 구성할 수 있습니다.'}
							</small>
						</aside>
					</div>
				</div>
			</section>
		</main>
	);
}

export default App;
