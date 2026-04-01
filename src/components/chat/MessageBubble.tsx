import React from 'react';
import { ConversationMessageItem } from '../../api';

interface MessageBubbleProps {
	message: ConversationMessageItem;
	isOwn: boolean;
	isJobHighlighted?: boolean;
	onJumpToJob?: (sequence: number) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, isJobHighlighted, onJumpToJob }) => {
	const bubbleClasses = [
		'max-w-[80%]',
		'rounded-2xl',
		'px-4',
		'py-3',
		'whitespace-pre-wrap',
		isOwn ? 'bg-[#6A1E55] text-white' : 'bg-white/10 text-white/90',
		message.job_sequence_id ? 'border border-amber-400/80' : 'border border-transparent',
		isJobHighlighted ? 'ring-2 ring-amber-300/70 shadow-lg' : 'ring-0',
	].join(' ');

	return (
		<div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
			<div className={bubbleClasses}>
				<p>{message.text}</p>

				{message.job_sequence_id && (
					<div className="mt-3 flex items-center justify-between gap-3 text-xs text-amber-200/90 bg-amber-500/10 rounded-xl px-3 py-2">
						<span>Linked to job #{message.job_sequence_id}</span>
						<button
							type="button"
							className="px-2 py-1 rounded-lg border border-amber-200/50 text-[11px] hover:bg-amber-200/20 transition-colors"
							onClick={() => onJumpToJob?.(message.job_sequence_id!)}
						>
							View job
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default MessageBubble;

