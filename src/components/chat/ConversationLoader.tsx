import React, { useEffect, useState } from 'react';
import { ConversationStreamItem, fetchConversation } from '../../api';

interface ConversationLoaderProps {
	conversationId?: number | null;
	refreshToken?: number;
	onLoaded?: (items: ConversationStreamItem[]) => void;
}

const ConversationLoader: React.FC<ConversationLoaderProps> = ({ conversationId, refreshToken = 0, onLoaded }) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [localRetry, setLocalRetry] = useState(0);

	useEffect(() => {
		let isMounted = true;
		if (!conversationId) {
			setError(null);
			setLoading(false);
			return () => {
				isMounted = false;
			};
		}

		async function loadConversation() {
			setLoading(true);
			setError(null);
			try {
				const response = await fetchConversation(conversationId);
				if (!isMounted) return;
				onLoaded?.(response.items ?? []);
			} catch (err) {
				if (!isMounted) return;
				setError(err instanceof Error ? err.message : 'Failed to load conversation');
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		loadConversation();

		return () => {
			isMounted = false;
		};
	}, [conversationId, refreshToken, localRetry, onLoaded]);

	if (!conversationId) {
		return null;
	}

	if (loading) {
		return <div className="text-center text-white/60 text-sm py-2">Loading conversation…</div>;
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-2 bg-red-500/10 text-red-200 text-sm rounded-lg p-3 border border-red-500/30">
				<span>{error}</span>
				<button
					type="button"
					onClick={() => setLocalRetry((prev) => prev + 1)}
					className="px-3 py-1.5 rounded-md bg-red-500/30 hover:bg-red-500/50 text-red-50 transition-colors text-xs"
				>
					Retry
				</button>
			</div>
		);
	}

	return null;
};

export default ConversationLoader;

