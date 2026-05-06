import { useState } from 'react';
import { ChevronRight, Hash, LockKeyhole, LogOut, MessageCircle, UserRound } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
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

type SidebarChannel = {
	id: string;
	name: string;
	visibility: 'public' | 'private';
	memberCount: number;
};

type SidebarDirectConversation = {
	id: string;
	label: string;
};

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
	onLogout: () => void;
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
	onLogout,
	onSelectChannel,
	onSelectDirectConversation
}: AppSidebarProps) {
	const [isChannelsOpen, setIsChannelsOpen] = useState(true);
	const [isDirectConversationsOpen, setIsDirectConversationsOpen] = useState(true);
	const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
	const selectedDirectConversation =
		directConversations.find((conversation) => conversation.id === selectedDirectConversationId) ?? null;

	return (
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
						<SidebarGroupLabel asChild>
							<CollapsibleTrigger>
								<Hash className="mr-2" />
								채널
								<ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
							</CollapsibleTrigger>
						</SidebarGroupLabel>
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
										<SidebarMenuItem key={channel.id}>
											<SidebarMenuButton
												type="button"
												isActive={channel.id === selectedChannelId}
												tooltip={channel.name}
												onClick={() => onSelectChannel(channel.id)}
											>
												{channel.visibility === 'public' ? <Hash /> : <LockKeyhole />}
												<span>{channel.name}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</CollapsibleContent>
						{!isChannelsOpen && selectedChannel ? (
							<SidebarGroupContent>
								<SidebarMenu className="pl-6 group-data-[collapsible=icon]:pl-0">
									<SidebarMenuItem>
										<SidebarMenuButton
											type="button"
											isActive
											tooltip={selectedChannel.name}
											onClick={() => onSelectChannel(selectedChannel.id)}
										>
											{selectedChannel.visibility === 'public' ? <Hash /> : <LockKeyhole />}
											<span>{selectedChannel.name}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
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
						<SidebarGroupLabel asChild>
							<CollapsibleTrigger>
								<MessageCircle className="mr-2" />
								다이렉트 메시지
								<ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
							</CollapsibleTrigger>
						</SidebarGroupLabel>
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
	);
}
