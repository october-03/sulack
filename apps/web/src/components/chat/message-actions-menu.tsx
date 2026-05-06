import { MoreVertical } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type MessageActionsMenuProps = {
	isMutating: boolean;
	onDelete: () => void;
	onEdit: () => void;
};

export function MessageActionsMenu({ isMutating, onDelete, onEdit }: MessageActionsMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="message-menu-trigger" type="button" disabled={isMutating}>
					<MoreVertical />
					<span className="sr-only">Message actions</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
				<DropdownMenuItem variant="destructive" onClick={onDelete}>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
