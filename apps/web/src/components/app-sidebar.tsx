import { FormEvent, useEffect, useState } from 'react';
import {
	ChevronRight,
	Compass,
	Hash,
	LockKeyhole,
	LogOut,
	MessageCircle,
	Plus,
	Search,
	UserPlus,
	UserRound
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail
} from '@/components/ui/sidebar';
import type { CreateChannelPayload, DirectConversationItem, SearchProfileItem } from '@/types/chat';

type SidebarChannel = {
	id: string;
	name: string;
	description?: string | null;
	visibility: 'public' | 'private';
	memberCount: number;
};

type SidebarDirectConversation = {
	id: string;
	label: string;
};

type SidebarSheet = 'create-channel' | 'discover-channels' | 'create-dm';

type AppSidebarProps = {
	authError: string | null;
	channelError: string | null;
	channels: SidebarChannel[];
	directConversationError: string | null;
	directConversations: SidebarDirectConversation[];
	isAuthLoading: boolean;
	isChannelLoading: boolean;
	isDirectConversationLoading: boolean;
	isSessionLoading: boolean;
	profileEmail: string;
	profileInitial: string;
	profileName: string;
	selectedChannelId: string | null;
	selectedDirectConversationId: string | null;
	onCreateChannel: (payload: CreateChannelPayload) => Promise<SidebarChannel>;
	onCreateDirectConversation: (userId: string) => Promise<DirectConversationItem>;
	onDiscoverChannels: () => Promise<SidebarChannel[]>;
	onJoinChannel: (channelId: string) => Promise<SidebarChannel>;
	onLogout: () => void;
	onSearchProfiles: (query: string) => Promise<SearchProfileItem[]>;
	onSelectChannel: (channelId: string) => void;
	onSelectDirectConversation: (conversationId: string) => void;
};

export function AppSidebar({
	authError,
	channelError,
	channels,
	directConversationError,
	directConversations,
	isAuthLoading,
	isChannelLoading,
	isDirectConversationLoading,
	isSessionLoading,
	profileEmail,
	profileInitial,
	profileName,
	selectedChannelId,
	selectedDirectConversationId,
	onCreateChannel,
	onCreateDirectConversation,
	onDiscoverChannels,
	onJoinChannel,
	onLogout,
	onSearchProfiles,
	onSelectChannel,
	onSelectDirectConversation
}: AppSidebarProps) {
	const [isChannelsOpen, setIsChannelsOpen] = useState(true);
	const [isDirectConversationsOpen, setIsDirectConversationsOpen] = useState(true);
	const [activeSheet, setActiveSheet] = useState<SidebarSheet | null>(null);
	const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
	const selectedDirectConversation =
		directConversations.find((conversation) => conversation.id === selectedDirectConversationId) ?? null;

	return (
		<>
			<Sidebar collapsible="icon">
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" tooltip={profileName}>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									{isSessionLoading ? <UserRound /> : profileInitial}
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{profileName}</span>
									<span className="truncate text-xs">{profileEmail}</span>
								</div>
							</SidebarMenuButton>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="absolute right-2 top-2 group-data-[collapsible=icon]:hidden"
								onClick={onLogout}
								disabled={isAuthLoading || isSessionLoading}
								aria-label="Log out"
							>
								<LogOut />
							</Button>
						</SidebarMenuItem>
					</SidebarMenu>
					{authError ? <p className="px-2 text-sm text-destructive">{authError}</p> : null}
				</SidebarHeader>

				<SidebarContent>
					<Collapsible open={isChannelsOpen} onOpenChange={setIsChannelsOpen} className="group/collapsible">
						<SidebarGroup>
							<SectionLabel
								icon={<Hash />}
								label="채널"
								menuLabel="채널 작업"
								onCreate={() => setActiveSheet('create-channel')}
								onDiscover={() => setActiveSheet('discover-channels')}
							/>
							<CollapsibleContent>
								<SidebarGroupContent>
									<SidebarMenu className="pl-6 group-data-[collapsible=icon]:pl-0">
										{isChannelLoading ? (
											<SidebarMenuItem>
												<SidebarMenuButton disabled>
													<span>채널 목록을 불러오는 중입니다...</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										) : null}
										{channelError ? (
											<SidebarMenuItem>
												<SidebarMenuButton disabled>
													<span>{channelError}</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										) : null}
										{!isChannelLoading && !channelError && channels.length === 0 ? (
											<SidebarMenuItem>
												<SidebarMenuButton disabled>
													<span>표시할 채널이 없습니다.</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										) : null}
										{channels.map((channel) => (
											<ChannelMenuItem
												key={channel.id}
												channel={channel}
												isActive={channel.id === selectedChannelId}
												onSelectChannel={onSelectChannel}
											/>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</CollapsibleContent>
							{!isChannelsOpen && selectedChannel ? (
								<SidebarGroupContent>
									<SidebarMenu className="pl-6 group-data-[collapsible=icon]:pl-0">
										<ChannelMenuItem channel={selectedChannel} isActive onSelectChannel={onSelectChannel} />
									</SidebarMenu>
								</SidebarGroupContent>
							) : null}
						</SidebarGroup>
					</Collapsible>

					<Collapsible
						open={isDirectConversationsOpen}
						onOpenChange={setIsDirectConversationsOpen}
						className="group/collapsible"
					>
						<SidebarGroup>
							<SectionLabel
								icon={<MessageCircle />}
								label="다이렉트 메시지"
								menuLabel="DM 작업"
								onCreate={() => setActiveSheet('create-dm')}
							/>
							<CollapsibleContent>
								<SidebarGroupContent>
									<SidebarMenu className="pl-6 group-data-[collapsible=icon]:pl-0">
										{isDirectConversationLoading ? (
											<SidebarMenuItem>
												<SidebarMenuButton disabled>
													<span>DM 목록을 불러오는 중입니다...</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										) : null}
										{directConversationError ? (
											<SidebarMenuItem>
												<SidebarMenuButton disabled>
													<span>{directConversationError}</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										) : null}
										{!isDirectConversationLoading && !directConversationError && directConversations.length === 0 ? (
											<SidebarMenuItem>
												<SidebarMenuButton disabled>
													<span>표시할 DM이 없습니다.</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										) : null}
										{directConversations.map((conversation) => (
											<SidebarMenuItem key={conversation.id}>
												<SidebarMenuButton
													type="button"
													isActive={conversation.id === selectedDirectConversationId}
													tooltip={conversation.label}
													onClick={() => onSelectDirectConversation(conversation.id)}
												>
													<MessageCircle />
													<span>{conversation.label}</span>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</CollapsibleContent>
							{!isDirectConversationsOpen && selectedDirectConversation ? (
								<SidebarGroupContent>
									<SidebarMenu className="pl-6 group-data-[collapsible=icon]:pl-0">
										<SidebarMenuItem>
											<SidebarMenuButton
												type="button"
												isActive
												tooltip={selectedDirectConversation.label}
												onClick={() => onSelectDirectConversation(selectedDirectConversation.id)}
											>
												<MessageCircle />
												<span>{selectedDirectConversation.label}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
								</SidebarGroupContent>
							) : null}
						</SidebarGroup>
					</Collapsible>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>

			<SidebarActionSheet
				activeSheet={activeSheet}
				onCreateChannel={onCreateChannel}
				onCreateDirectConversation={onCreateDirectConversation}
				onDiscoverChannels={onDiscoverChannels}
				onJoinChannel={onJoinChannel}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setActiveSheet(null);
					}
				}}
				onSearchProfiles={onSearchProfiles}
			/>
		</>
	);
}

function SectionLabel({
	icon,
	label,
	menuLabel,
	onCreate,
	onDiscover
}: {
	icon: React.ReactNode;
	label: string;
	menuLabel: string;
	onCreate: () => void;
	onDiscover?: () => void;
}) {
	return (
		<SidebarGroupLabel className="group/sidebar-section relative pr-8">
			<CollapsibleTrigger className="flex min-w-0 flex-1 items-center">
				<span className="mr-2 [&>svg]:size-4">{icon}</span>
				<span className="truncate text-sm">{label}</span>
				<ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
			</CollapsibleTrigger>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/sidebar-section:opacity-100 group-hover/sidebar-section:opacity-100 group-data-[collapsible=icon]:hidden"
						aria-label={menuLabel}
					>
						<Plus />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-44">
					<DropdownMenuItem onSelect={onCreate}>
						{onDiscover ? <Plus /> : <UserPlus />}
						<span>{onDiscover ? '채널 추가' : 'DM 추가'}</span>
					</DropdownMenuItem>
					{onDiscover ? (
						<DropdownMenuItem onSelect={onDiscover}>
							<Compass />
							<span>채널 탐색</span>
						</DropdownMenuItem>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarGroupLabel>
	);
}

function ChannelMenuItem({
	channel,
	isActive,
	onSelectChannel
}: {
	channel: SidebarChannel;
	isActive: boolean;
	onSelectChannel: (channelId: string) => void;
}) {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				type="button"
				isActive={isActive}
				tooltip={channel.name}
				onClick={() => onSelectChannel(channel.id)}
			>
				{channel.visibility === 'public' ? <Hash /> : <LockKeyhole />}
				<span>{channel.name}</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

function SidebarActionSheet({
	activeSheet,
	onCreateChannel,
	onCreateDirectConversation,
	onDiscoverChannels,
	onJoinChannel,
	onOpenChange,
	onSearchProfiles
}: {
	activeSheet: SidebarSheet | null;
	onCreateChannel: (payload: CreateChannelPayload) => Promise<SidebarChannel>;
	onCreateDirectConversation: (userId: string) => Promise<DirectConversationItem>;
	onDiscoverChannels: () => Promise<SidebarChannel[]>;
	onJoinChannel: (channelId: string) => Promise<SidebarChannel>;
	onOpenChange: (isOpen: boolean) => void;
	onSearchProfiles: (query: string) => Promise<SearchProfileItem[]>;
}) {
	return (
		<Sheet open={Boolean(activeSheet)} onOpenChange={onOpenChange}>
			<SheetContent side="left" className="w-[min(92vw,24rem)] sm:max-w-md">
				{activeSheet === 'create-channel' ? (
					<CreateChannelSheet onCreateChannel={onCreateChannel} onDone={() => onOpenChange(false)} />
				) : null}
				{activeSheet === 'discover-channels' ? (
					<DiscoverChannelsSheet
						onDiscoverChannels={onDiscoverChannels}
						onDone={() => onOpenChange(false)}
						onJoinChannel={onJoinChannel}
					/>
				) : null}
				{activeSheet === 'create-dm' ? (
					<CreateDirectConversationSheet
						onCreateDirectConversation={onCreateDirectConversation}
						onDone={() => onOpenChange(false)}
						onSearchProfiles={onSearchProfiles}
					/>
				) : null}
			</SheetContent>
		</Sheet>
	);
}

function CreateChannelSheet({
	onCreateChannel,
	onDone
}: {
	onCreateChannel: (payload: CreateChannelPayload) => Promise<SidebarChannel>;
	onDone: () => void;
}) {
	const [description, setDescription] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [name, setName] = useState('');
	const [visibility, setVisibility] = useState<CreateChannelPayload['visibility']>('public');

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			await onCreateChannel({
				description: description.trim() || undefined,
				name: name.trim(),
				visibility
			});
			onDone();
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : '채널을 만들지 못했습니다.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<SheetHeader>
				<SheetTitle>채널 추가</SheetTitle>
				<SheetDescription>새 채널을 만듭니다.</SheetDescription>
			</SheetHeader>
			<form className="flex flex-1 flex-col gap-4 px-4" onSubmit={handleSubmit}>
				<div className="grid gap-2">
					<Label htmlFor="channel-name">이름</Label>
					<Input
						id="channel-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={80}
						required
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="channel-description">설명</Label>
					<Input
						id="channel-description"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						maxLength={200}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="channel-visibility">공개 범위</Label>
					<select
						id="channel-visibility"
						value={visibility}
						onChange={(event) => setVisibility(event.target.value as CreateChannelPayload['visibility'])}
						className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<option value="public">공개</option>
						<option value="private">비공개</option>
					</select>
				</div>
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					채널 만들기
				</Button>
			</form>
		</>
	);
}

function DiscoverChannelsSheet({
	onDiscoverChannels,
	onDone,
	onJoinChannel
}: {
	onDiscoverChannels: () => Promise<SidebarChannel[]>;
	onDone: () => void;
	onJoinChannel: (channelId: string) => Promise<SidebarChannel>;
}) {
	const [channels, setChannels] = useState<SidebarChannel[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		const loadChannels = async () => {
			setError(null);
			setIsLoading(true);

			try {
				const nextChannels = await onDiscoverChannels();

				if (isMounted) {
					setChannels(nextChannels);
				}
			} catch (loadError) {
				if (isMounted) {
					setError(loadError instanceof Error ? loadError.message : '채널을 불러오지 못했습니다.');
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		void loadChannels();

		return () => {
			isMounted = false;
		};
	}, [onDiscoverChannels]);

	const handleJoin = async (channelId: string) => {
		setError(null);
		setJoiningChannelId(channelId);

		try {
			await onJoinChannel(channelId);
			onDone();
		} catch (joinError) {
			setError(joinError instanceof Error ? joinError.message : '채널에 참여하지 못했습니다.');
		} finally {
			setJoiningChannelId(null);
		}
	};

	return (
		<>
			<SheetHeader>
				<SheetTitle>채널 탐색</SheetTitle>
				<SheetDescription>참여할 수 있는 공개 채널입니다.</SheetDescription>
			</SheetHeader>
			<div className="flex flex-1 flex-col gap-2 overflow-auto px-4">
				{isLoading ? <p className="text-sm text-muted-foreground">채널을 불러오는 중입니다...</p> : null}
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
				{!isLoading && !error && channels.length === 0 ? (
					<p className="text-sm text-muted-foreground">탐색할 채널이 없습니다.</p>
				) : null}
				{channels.map((channel) => (
					<div key={channel.id} className="flex items-start gap-3 rounded-md border border-border p-3">
						<Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{channel.name}</p>
							{channel.description ? (
								<p className="line-clamp-2 text-xs text-muted-foreground">{channel.description}</p>
							) : null}
							<p className="mt-1 text-xs text-muted-foreground">{channel.memberCount}명</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={joiningChannelId === channel.id}
							onClick={() => void handleJoin(channel.id)}
						>
							참여
						</Button>
					</div>
				))}
			</div>
		</>
	);
}

function CreateDirectConversationSheet({
	onCreateDirectConversation,
	onDone,
	onSearchProfiles
}: {
	onCreateDirectConversation: (userId: string) => Promise<DirectConversationItem>;
	onDone: () => void;
	onSearchProfiles: (query: string) => Promise<SearchProfileItem[]>;
}) {
	const [error, setError] = useState<string | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchProfileItem[]>([]);
	const [startingUserId, setStartingUserId] = useState<string | null>(null);

	const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setIsSearching(true);

		try {
			setResults(await onSearchProfiles(query.trim()));
		} catch (searchError) {
			setResults([]);
			setError(searchError instanceof Error ? searchError.message : '사용자를 찾지 못했습니다.');
		} finally {
			setIsSearching(false);
		}
	};

	const handleStart = async (userId: string) => {
		setError(null);
		setStartingUserId(userId);

		try {
			await onCreateDirectConversation(userId);
			onDone();
		} catch (startError) {
			setError(startError instanceof Error ? startError.message : 'DM을 시작하지 못했습니다.');
		} finally {
			setStartingUserId(null);
		}
	};

	return (
		<>
			<SheetHeader>
				<SheetTitle>DM 추가</SheetTitle>
				<SheetDescription>대화할 사람을 찾습니다.</SheetDescription>
			</SheetHeader>
			<div className="flex flex-1 flex-col gap-4 overflow-auto px-4">
				<form className="flex gap-2" onSubmit={handleSearch}>
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="이름 또는 이메일"
						maxLength={100}
						required
					/>
					<Button type="submit" variant="outline" size="icon" disabled={isSearching || !query.trim()} aria-label="검색">
						<Search />
					</Button>
				</form>
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
				{!isSearching && query.trim() && results.length === 0 && !error ? (
					<p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
				) : null}
				{results.map((profile) => (
					<div key={profile.id} className="flex items-center gap-3 rounded-md border border-border p-3">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">
							{profile.displayName.slice(0, 1).toUpperCase()}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{profile.displayName}</p>
							<p className="truncate text-xs text-muted-foreground">{profile.email}</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={startingUserId === profile.id}
							onClick={() => void handleStart(profile.id)}
						>
							시작
						</Button>
					</div>
				))}
			</div>
		</>
	);
}
