import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Hash, Search, UserPlus, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type {
	ChannelItem,
	ChannelMemberItem,
	DirectConversationParticipant,
	SearchProfileItem
} from '@/types/chat';

type ChatHeaderProps = {
	memberCount?: number;
	onAddChannelMember: (channelId: string, userId: string) => Promise<ChannelItem>;
	onGetChannelMembers: (channelId: string, signal?: AbortSignal) => Promise<ChannelMemberItem[]>;
	onSearchProfiles: (query: string) => Promise<SearchProfileItem[]>;
	participants?: DirectConversationParticipant[];
	selectedChannel: ChannelItem | null;
	title: string;
	variant: 'channel' | 'directConversation' | 'empty';
};

export function ChatHeader({
	memberCount = 0,
	onAddChannelMember,
	onGetChannelMembers,
	onSearchProfiles,
	participants = [],
	selectedChannel,
	title,
	variant
}: ChatHeaderProps) {
	const [isMembersOpen, setIsMembersOpen] = useState(false);
	const totalCount = variant === 'channel' ? memberCount : 0;

	return (
		<>
			<header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
				<div className="flex min-w-0 items-center gap-2">
					<SidebarTrigger />
					<Separator orientation="vertical" className="mr-2" />
					<div className="min-w-0 flex items-center">
						<Hash className="mr-2 mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<h1 className="truncate text-base font-semibold">{title}</h1>
					</div>
				</div>
				{totalCount > 0 ? (
					<ParticipantSummary
						count={totalCount}
						onClick={variant === 'channel' ? () => setIsMembersOpen(true) : undefined}
						participants={participants}
						variant={variant}
					/>
				) : null}
			</header>
			<Sheet open={isMembersOpen} onOpenChange={setIsMembersOpen}>
				<SheetContent side="right" className="w-[min(92vw,26rem)] sm:max-w-md">
					{selectedChannel ? (
						<ChannelMembersSheet
							channel={selectedChannel}
							onAddChannelMember={onAddChannelMember}
							onGetChannelMembers={onGetChannelMembers}
							onSearchProfiles={onSearchProfiles}
						/>
					) : null}
				</SheetContent>
			</Sheet>
		</>
	);
}

function ParticipantSummary({
	count,
	onClick,
	participants,
	variant
}: {
	count: number;
	onClick?: () => void;
	participants: DirectConversationParticipant[];
	variant: ChatHeaderProps['variant'];
}) {
	const visibleCount = Math.min(count, 4);
	const placeholders = Array.from({ length: visibleCount });
	const content = (
		<>
			<div className="flex items-center">
				{variant === 'directConversation'
					? participants
							.slice(0, 4)
							.map((participant, index) => (
								<ParticipantAvatar key={participant.id} index={index} participant={participant} />
							))
					: placeholders.map((_, index) => <ParticipantAvatar key={index} index={index} />)}
			</div>
			<span className="ml-2 min-w-3 text-sm font-semibold tabular-nums text-muted-foreground">{count}</span>
		</>
	);

	if (!onClick) {
		return <div className="flex shrink-0 items-center rounded-xl border border-border bg-background px-1.5 py-1 shadow-xs">{content}</div>;
	}

	return (
		<Button
			type="button"
			variant="outline"
			className="h-auto shrink-0 rounded-xl px-1.5 py-1 shadow-xs"
			onClick={onClick}
			aria-label="채널 인원 보기"
		>
			{content}
		</Button>
	);
}

function ParticipantAvatar({ index, participant }: { index: number; participant?: DirectConversationParticipant }) {
	const initial = participant?.displayName.slice(0, 1).toUpperCase();
	const tones = [
		'bg-violet-950 text-white',
		'bg-sky-500 text-white',
		'bg-zinc-950 text-white',
		'bg-purple-950 text-white'
	];

	return (
		<div
			className={`flex size-8 items-center justify-center overflow-hidden rounded-md border-2 border-background ${index > 0 ? '-ml-2' : ''} ${tones[index % tones.length]}`}
			title={participant?.displayName}
		>
			{participant?.avatarUrl ? (
				<img src={participant.avatarUrl} alt="" className="size-full object-cover" />
			) : initial ? (
				<span className="text-sm font-semibold">{initial}</span>
			) : (
				<UserRound className="size-5" />
			)}
		</div>
	);
}

function ChannelMembersSheet({
	channel,
	onAddChannelMember,
	onGetChannelMembers,
	onSearchProfiles
}: {
	channel: ChannelItem;
	onAddChannelMember: (channelId: string, userId: string) => Promise<ChannelItem>;
	onGetChannelMembers: (channelId: string, signal?: AbortSignal) => Promise<ChannelMemberItem[]>;
	onSearchProfiles: (query: string) => Promise<SearchProfileItem[]>;
}) {
	const [addError, setAddError] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isAddingUserId, setIsAddingUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [members, setMembers] = useState<ChannelMemberItem[]>([]);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchProfileItem[]>([]);
	const canAddMembers = channel.visibility === 'public' || channel.membership?.role === 'admin';
	const memberIds = useMemo(() => new Set(members.map((member) => member.user.id)), [members]);
	const addableResults = results.filter((profile) => !memberIds.has(profile.id));

	useEffect(() => {
		const abortController = new AbortController();

		const loadMembers = async () => {
			setError(null);
			setIsLoading(true);

			try {
				setMembers(await onGetChannelMembers(channel.id, abortController.signal));
			} catch (loadError) {
				if (loadError instanceof DOMException && loadError.name === 'AbortError') {
					return;
				}

				setMembers([]);
				setError(loadError instanceof Error ? loadError.message : '멤버를 불러오지 못했습니다.');
			} finally {
				setIsLoading(false);
			}
		};

		void loadMembers();

		return () => {
			abortController.abort();
		};
	}, [channel.id, onGetChannelMembers]);

	const reloadMembers = async () => {
		setMembers(await onGetChannelMembers(channel.id));
	};

	const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setAddError(null);
		setIsSearching(true);

		try {
			setResults(await onSearchProfiles(query.trim()));
		} catch (searchError) {
			setResults([]);
			setAddError(searchError instanceof Error ? searchError.message : '사용자를 찾지 못했습니다.');
		} finally {
			setIsSearching(false);
		}
	};

	const handleAddMember = async (userId: string) => {
		setAddError(null);
		setIsAddingUserId(userId);

		try {
			await onAddChannelMember(channel.id, userId);
			await reloadMembers();
			setResults((currentResults) => currentResults.filter((profile) => profile.id !== userId));
		} catch (addMemberError) {
			setAddError(addMemberError instanceof Error ? addMemberError.message : '사용자를 추가하지 못했습니다.');
		} finally {
			setIsAddingUserId(null);
		}
	};

	return (
		<>
			<SheetHeader>
				<SheetTitle>채널 인원</SheetTitle>
				<SheetDescription>#{channel.name}</SheetDescription>
			</SheetHeader>
			<div className="flex flex-1 flex-col gap-5 overflow-auto px-4 pb-4">
				<section className="grid gap-2">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-medium">명단</h2>
						<span className="text-xs text-muted-foreground">{members.length}명</span>
					</div>
					{isLoading ? <p className="text-sm text-muted-foreground">멤버를 불러오는 중입니다...</p> : null}
					{error ? <p className="text-sm text-destructive">{error}</p> : null}
					{members.map((member) => (
						<div key={member.user.id} className="flex items-center gap-3 rounded-md border border-border p-3">
							<MemberAvatar avatarUrl={member.user.avatarUrl} name={member.user.displayName} />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{member.user.displayName}</p>
								<p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
							</div>
							<span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
								{member.role === 'admin' ? '관리자' : '멤버'}
							</span>
						</div>
					))}
				</section>

				<section className="grid gap-3 border-t pt-4">
					<div>
						<h2 className="text-sm font-medium">사용자 추가</h2>
						{canAddMembers ? null : (
							<p className="mt-1 text-xs text-muted-foreground">비공개 채널은 관리자만 사용자를 추가할 수 있습니다.</p>
						)}
					</div>
					<form className="flex gap-2" onSubmit={handleSearch}>
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="이름 또는 이메일"
							maxLength={100}
							disabled={!canAddMembers}
							required
						/>
						<Button
							type="submit"
							variant="outline"
							size="icon"
							disabled={!canAddMembers || isSearching || !query.trim()}
							aria-label="사용자 검색"
						>
							<Search />
						</Button>
					</form>
					{addError ? <p className="text-sm text-destructive">{addError}</p> : null}
					{canAddMembers && !isSearching && query.trim() && addableResults.length === 0 && !addError ? (
						<p className="text-sm text-muted-foreground">추가할 사용자가 없습니다.</p>
					) : null}
					{addableResults.map((profile) => (
						<div key={profile.id} className="flex items-center gap-3 rounded-md border border-border p-3">
							<MemberAvatar avatarUrl={profile.avatarUrl} name={profile.displayName} />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{profile.displayName}</p>
								<p className="truncate text-xs text-muted-foreground">{profile.email}</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={isAddingUserId === profile.id}
								onClick={() => void handleAddMember(profile.id)}
							>
								<UserPlus />
								추가
							</Button>
						</div>
					))}
				</section>
			</div>
		</>
	);
}

function MemberAvatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
	const initial = name.slice(0, 1).toUpperCase();

	return (
		<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-sm font-semibold">
			{avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initial}
		</div>
	);
}
