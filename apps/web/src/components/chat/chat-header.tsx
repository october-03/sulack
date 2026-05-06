import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

type ChatHeaderProps = {
	memberCount?: number;
	title: string;
	variant: 'channel' | 'directConversation' | 'empty';
};

export function ChatHeader({ memberCount, title, variant }: ChatHeaderProps) {
	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b">
			<div className="flex min-w-0 flex-1 items-center gap-2 px-3">
				<SidebarTrigger />
				<Separator orientation="vertical" className="mr-2 h-4" />
				<div className="min-w-0">
					<h1 className="truncate text-base font-semibold">{title}</h1>
					<p className="truncate text-xs text-muted-foreground">
						{variant === 'channel'
							? `${memberCount ?? 0} members`
							: variant === 'directConversation'
								? 'Direct message'
								: 'Select a conversation'}
					</p>
				</div>
			</div>
		</header>
	);
}
