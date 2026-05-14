import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
	addFavoriteJob,
	ChatJobCard,
	ChatMessage,
	ConversationJobItem,
	ConversationMessageItem,
	ConversationStreamItem,
	ConversationSummary,
	FavoriteJobCreate,
	MessageCreateRequest,
	getChatResponse,
	getStoredUser,
	saveConversationJob,
	saveConversationMessage,
	fetchConversations,
} from '../../api';
import ConversationLoader from './ConversationLoader';
import MessageBubble from './MessageBubble';
import JobCard from './JobCard';

const CONVERSATION_STORAGE_KEY = 'voxjobs_conversation_id';
const VOICE_WS_PATH = '/ws/voice_chat';
const VOICE_SILENCE_DURATION = 1800;
const VOICE_AUDIO_THRESHOLD = 0.01;
const VOICE_WS_CONNECT_TIMEOUT_MS = 8000;

type VoiceSocketMessage = {
	type?: string;
	message?: string;
	text?: string;
	jobs?: ChatJobCard[];
};

function getStoredConversationId(): number | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(CONVERSATION_STORAGE_KEY);
		return raw ? Number(raw) : null;
	} catch {
		return null;
	}
}

function persistConversationId(id: number) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(CONVERSATION_STORAGE_KEY, String(id));
	} catch {
		// ignore
	}
}

function removeConversationId() {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(CONVERSATION_STORAGE_KEY);
	} catch {
		// ignore
	}
}

function parseBotResponse(raw: string) {
	const marker = '__CARDS__';
	const idx = raw.indexOf(marker);
	if (idx === -1) {
		return { text: raw.trim(), cards: [] as ChatJobCard[] };
	}

	const text = raw.substring(0, idx).trim();
	let payload = raw.substring(idx + marker.length).trim();
	let cards: ChatJobCard[] = [];
	if (!payload) {
		return { text, cards };
	}
	try {
		if (payload.startsWith('[')) {
			cards = JSON.parse(payload);
		} else {
			cards = JSON.parse(`[${payload}]`);
		}
	} catch (err) {
		console.warn('Failed to parse job cards from bot response', err);
	}
	return { text, cards };
}

function normalizeBotPayload(response: any) {
	if (!response) {
		return { text: 'I could not understand that, please try again.', cards: [] as ChatJobCard[] };
	}
	
	// Handle different response formats
	let messageText: string = '';
	let jobs: ChatJobCard[] = [];
	
	if (response?.response) {
		messageText = response.response.message || '';
		jobs = response.response.jobs || [];
	} else if (typeof response === 'string') {
		messageText = response;
	} else if (response?.message) {
		messageText = response.message;
		jobs = response.jobs || [];
	}
	
	// Clean up message text
	messageText = messageText.trim();
	
	// Handle __CARDS__ marker
	if (messageText.includes('__CARDS__')) {
		const parsed = parseBotResponse(messageText);
		return {
			text: parsed.text.trim() || 'Here are some matching jobs for you.',
			cards: parsed.cards.length ? parsed.cards : jobs,
		};
	}
	
	// Ensure we always have a message
	if (!messageText || messageText === 'TEXT_MESSAGE') {
		messageText = jobs.length > 0 
			? 'Here are some matching jobs for you.' 
			: 'I found some information for you.';
	}
	
	return { text: messageText, cards: jobs };
}

function buildConversationHistory(items: ConversationStreamItem[]): ChatMessage[] {
	const sorted = [...items].sort((a, b) => a.sequence_num - b.sequence_num);
	const history: ChatMessage[] = [];
	let pendingUser: ConversationMessageItem | null = null;
	let jobBuffer: ConversationJobItem[] = [];

	for (const entry of sorted) {
		if (entry.type === 'job') {
			jobBuffer.push(entry);
			continue;
		}

		if (entry.sender === 'user') {
			pendingUser = entry;
			jobBuffer = [];
			continue;
		}

		if (entry.sender === 'llm' && pendingUser) {
			const cardsSuffix = `\n\n__CARDS__ ${JSON.stringify(jobBuffer.map((job) => job.job_json))}`;
			history.push({
				userMessage: pendingUser.text,
				botResponse: entry.text + cardsSuffix,
			});
			pendingUser = null;
			jobBuffer = [];
			continue;
		}
		jobBuffer = [];
	}

	return history;
}

function upsertItem(current: ConversationStreamItem[], next: ConversationStreamItem) {
	const filtered = current.filter((item) => !(item.type === next.type && item.id === next.id));
	return [...filtered, next].sort((a, b) => a.sequence_num - b.sequence_num);
}

interface ToastState {
	message: string;
	type: 'success' | 'error';
}

interface ChatWindowProps {
	onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
	const user = useMemo(() => getStoredUser(), []);
	const userEmail = useMemo(() => (user?.email || '').trim(), [user]);
	const [conversationId, setConversationId] = useState<number | null>(() => getStoredConversationId());
	const [items, setItems] = useState<ConversationStreamItem[]>([]);
	const [conversations, setConversations] = useState<ConversationSummary[]>([]);
	const [input, setInput] = useState('');
	const [loadingReply, setLoadingReply] = useState(false);
	const [selectedJobSequence, setSelectedJobSequence] = useState<number | null>(null);
	const [highlightedJobSequence, setHighlightedJobSequence] = useState<number | null>(null);
	const [toast, setToast] = useState<ToastState | null>(null);
	const [pendingItems, setPendingItems] = useState<ConversationStreamItem[]>([]);
	const [localSequenceCounter, setLocalSequenceCounter] = useState(0);
	const [isVoiceListening, setIsVoiceListening] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const processorRef = useRef<ScriptProcessorNode | null>(null);
	const silenceTimerRef = useRef<number | null>(null);
	const lastSoundTimeRef = useRef<number>(Date.now());
	const hasSpokenRef = useRef(false);
	const isVoiceListeningRef = useRef(false);
	const loadingReplyRef = useRef(false);
	const itemsRef = useRef<ConversationStreamItem[]>([]);
	const localSeqRef = useRef(0);

	useEffect(() => {
		itemsRef.current = items;
	}, [items]);

	useEffect(() => {
		localSeqRef.current = localSequenceCounter;
	}, [localSequenceCounter]);

	useEffect(() => {
		loadingReplyRef.current = loadingReply;
	}, [loadingReply]);

	const voiceWsUrl = useMemo(() => {
		const explicitSocketUrl = (import.meta.env.VITE_VOICE_CHAT_WS_URL as string | undefined)?.trim();
		const chatBackendHttp = (import.meta.env.VITE_CHAT_BACKEND_URL as string | undefined)?.trim();
		const backendHttp = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() || 'http://localhost:8000';
		const withUserEmail = (rawUrl: string) => {
			if (!userEmail) return rawUrl;
			const separator = rawUrl.includes('?') ? '&' : '?';
			return `${rawUrl}${separator}User_Email=${encodeURIComponent(userEmail)}`;
		};

		if (explicitSocketUrl) return withUserEmail(explicitSocketUrl);
		if (chatBackendHttp) {
			try {
				const parsed = new URL(chatBackendHttp.replace(/\/+$/, ''));
				const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
				return withUserEmail(`${wsProtocol}//${parsed.host}${VOICE_WS_PATH}`);
			} catch {
				// fall through
			}
		}
		try {
			const parsed = new URL(backendHttp.replace(/\/+$/, ''));
			const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
			return withUserEmail(`${wsProtocol}//${parsed.host}${VOICE_WS_PATH}`);
		} catch {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			return withUserEmail(`${protocol}//${window.location.host}${VOICE_WS_PATH}`);
		}
	}, [userEmail]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [items, loadingReply]);

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 3000);
		return () => clearTimeout(timer);
	}, [toast]);

	const handleConversationLoaded = useCallback(
		(fetched: ConversationStreamItem[]) => {
			setItems((prev) => {
				if (!prev.length) {
					const sorted = [...fetched].sort((a, b) => a.sequence_num - b.sequence_num);
					// Initialize sequence counter from loaded items
					if (sorted.length > 0) {
						const maxSeq = Math.max(...sorted.map((item) => item.sequence_num));
						setLocalSequenceCounter(maxSeq);
					}
					return sorted;
				}
				const mapped = new Map<string, ConversationStreamItem>();
				for (const entry of [...prev, ...fetched]) {
					const key = `${entry.type}-${entry.id}`;
					mapped.set(key, entry);
				}
				const merged = Array.from(mapped.values()).sort((a, b) => a.sequence_num - b.sequence_num);
				// Update sequence counter
				if (merged.length > 0) {
					const maxSeq = Math.max(...merged.map((item) => item.sequence_num));
					setLocalSequenceCounter(maxSeq);
				}
				return merged;
			});
		},
		[setItems],
	);

	// Load available conversations for the user (if logged in)
	useEffect(() => {
		let active = true;
		if (!user?.user_id) return;
		(async () => {
			try {
				const res = await fetchConversations(user.user_id);
				if (!active) return;
				setConversations(res.conversations || []);
			} catch (err) {
				console.error('Failed to load conversations list', err);
			}
		})();
		return () => {
			active = false;
		};
	}, [user?.user_id]);

	const defaultMessage: ConversationMessageItem = useMemo(
		() => ({
			type: 'message',
			id: -1,
			conversation_id: -1,
			sender: 'llm',
			text: "Hi there! I'm your job assistant. Tell me what kind of role you want and I'll fetch openings for you.",
			sequence_num: 0,
			job_sequence_id: null,
			created_at: new Date().toISOString(),
		}),
		[],
	);

	// Ensure items are always sorted by sequence_num
	const renderedItems = useMemo(() => {
		if (!items.length) return [defaultMessage];
		return [...items].sort((a, b) => a.sequence_num - b.sequence_num);
	}, [items]);

	const jobReferenceMap = useMemo(() => {
		const map = new Map<number, number>();
		for (const entry of items) {
			if (entry.type === 'message' && entry.job_sequence_id) {
				map.set(entry.job_sequence_id, (map.get(entry.job_sequence_id) ?? 0) + 1);
			}
		}
		return map;
	}, [items]);

	async function saveJobToFavorites(card: ChatJobCard) {
		if (!user?.user_id || !user.email) {
			setToast({ message: 'Login to save jobs to your favorites.', type: 'error' });
			return;
		}
		const payload: FavoriteJobCreate = {
			user_id: user.user_id,
			email: user.email,
			title: card.title,
			company_name: card.company_name,
			company_link: null,
			job_link: card.job_link || null,
			location: card.location || card.city || null,
			city: card.city || null,
			source_city: card.city || null,
			salary: card.salary ?? null,
			job_type: card.job_type ?? null,
			job_shift: card.job_shift ?? null,
			experience: card.experience ?? null,
			education: card.education ?? null,
			posted_date: card.posted_date ?? null,
			apply_before: card.apply_before ?? null,
			job_description: card.job_description ?? null,
			skills: card.skills ?? null,
			job_source: card.job_source ?? null,
			is_active: true,
		};
		try {
			await addFavoriteJob(payload);
			setToast({ message: 'Job saved to favorites.', type: 'success' });
		} catch (error) {
			console.error('Failed to save job favorite', error);
			setToast({ message: 'Failed to save job. Please try again.', type: 'error' });
		}
	}

	// Save all pending items to database
	async function savePendingItems() {
		if (pendingItems.length === 0) return;

		let nextConversationId = conversationId;
		const itemsToSave = [...pendingItems];
		let firstUserMessageIndex = -1;

		// Get or create conversation
		if (!nextConversationId) {
			firstUserMessageIndex = itemsToSave.findIndex((item) => item.type === 'message' && item.sender === 'user');
			if (firstUserMessageIndex >= 0 && user?.user_id) {
				try {
					const firstMessage = itemsToSave[firstUserMessageIndex] as ConversationMessageItem;
					const payload: MessageCreateRequest = {
						conversation_id: null,
						user_id: user.user_id,
						sender: 'user',
						text: firstMessage.text,
						job_sequence_id: firstMessage.job_sequence_id ?? null,
					};
					const saved = await saveConversationMessage(payload);
					nextConversationId = saved.conversation_id;
					setConversationId(nextConversationId);
					persistConversationId(nextConversationId);
				} catch (error) {
					console.error('Failed to create conversation', error);
					return;
				}
			} else if (!user?.user_id) {
				// No user logged in, can't create conversation
				console.warn('Cannot save conversation: user not logged in');
				return;
			}
		}

		if (!nextConversationId) return;

		// Save all items in sequence, skipping the first user message if it was used to create conversation
		for (let i = 0; i < itemsToSave.length; i++) {
			if (i === firstUserMessageIndex) continue; // Skip first message as it's already saved

			try {
				const item = itemsToSave[i];
				if (item.type === 'message') {
					await saveConversationMessage({
						conversation_id: nextConversationId,
						sender: item.sender,
						text: item.text,
						job_sequence_id: item.job_sequence_id ?? null,
					});
				} else if (item.type === 'job') {
					await saveConversationJob({
						conversation_id: nextConversationId,
						job_json: item.job_json,
					});
				}
			} catch (error) {
				console.error('Failed to save item', error);
			}
		}

		setPendingItems([]);
	}

	async function handleSend() {
		if (!input.trim() || loadingReply) return;
		const text = input.trim();
		setInput('');
		setLoadingReply(true);

		// Create local user message (not saved to DB yet)
		const userSequence = localSequenceCounter + 1;
		const userMessage: ConversationMessageItem = {
			type: 'message',
			id: -Date.now(), // Temporary negative ID
			conversation_id: conversationId ?? -1,
			sender: 'user',
			text,
			sequence_num: userSequence,
			job_sequence_id: selectedJobSequence ?? null,
			created_at: new Date().toISOString(),
		};

		let workingItems = upsertItem(items, userMessage);
		setItems(workingItems);
		setPendingItems((prev) => [...prev, userMessage]);
		setLocalSequenceCounter(userSequence);
		setSelectedJobSequence(null);
		setHighlightedJobSequence(userMessage.job_sequence_id ?? null);

		// Fetch chat response
		const history = buildConversationHistory(workingItems);
		let botText = 'Sorry, I could not get a reply right now.';
		let cards: ChatJobCard[] = [];

		try {
			const chatResponse = await getChatResponse(text, history);
			const normalized = normalizeBotPayload(chatResponse);
			botText = normalized.text?.trim() || 'Here are some matching jobs for you.';
			cards = normalized.cards || [];
		} catch (err) {
			console.error('Chat response failed', err);
		}

		// Create local bot message FIRST (before jobs) to maintain correct order
		let currentSequence = userSequence + 1;
		const botMessage: ConversationMessageItem = {
			type: 'message',
			id: -Date.now() - 1000, // Temporary negative ID
			conversation_id: conversationId ?? -1,
			sender: 'llm',
			text: botText,
			sequence_num: currentSequence,
			job_sequence_id: null,
			created_at: new Date().toISOString(),
		};

		workingItems = upsertItem(workingItems, botMessage);
		setPendingItems((prev) => [...prev, botMessage]);

		// Create local job items AFTER bot message
		const jobItems: ConversationJobItem[] = [];
		for (const card of cards) {
			currentSequence += 1;
			const jobItem: ConversationJobItem = {
				type: 'job',
				id: -Date.now() - Math.random(), // Temporary negative ID
				conversation_id: conversationId ?? -1,
				job_json: card,
				sequence_num: currentSequence,
				created_at: new Date().toISOString(),
			};
			jobItems.push(jobItem);
			workingItems = upsertItem(workingItems, jobItem);
			setPendingItems((prev) => [...prev, jobItem]);
		}

		// Update state once with all items properly sorted
		setItems(workingItems);
		setLocalSequenceCounter(currentSequence);
		setLoadingReply(false);
	}

	function handleSelectJob(sequence: number) {
		setSelectedJobSequence((current) => (current === sequence ? null : sequence));
		setHighlightedJobSequence((current) => (current === sequence ? null : sequence));
	}

	function handleJumpToJob(sequence: number) {
		setHighlightedJobSequence(sequence);
		setSelectedJobSequence(null);
		const elementId = `job-sequence-${sequence}`;
		const element = document.getElementById(elementId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	const clearSilenceTimer = useCallback(() => {
		if (silenceTimerRef.current !== null) {
			window.clearTimeout(silenceTimerRef.current);
			silenceTimerRef.current = null;
		}
	}, []);

	const float32ToPCM16 = useCallback((float32Array: Float32Array) => {
		const buffer = new ArrayBuffer(float32Array.length * 2);
		const view = new DataView(buffer);
		for (let i = 0; i < float32Array.length; i += 1) {
			const sample = Math.max(-1, Math.min(1, float32Array[i]));
			view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
		}
		return buffer;
	}, []);

	const detectSilence = useCallback((floatData: Float32Array) => {
		let sum = 0;
		for (let i = 0; i < floatData.length; i += 1) {
			sum += floatData[i] * floatData[i];
		}
		const rms = Math.sqrt(sum / floatData.length);
		return rms < VOICE_AUDIO_THRESHOLD;
	}, []);

	const appendUserMessage = useCallback((text: string) => {
		const content = text.trim();
		if (!content) return;
		const userSequence = localSeqRef.current + 1;
		const userMessage: ConversationMessageItem = {
			type: 'message',
			id: -Date.now() - Math.floor(Math.random() * 1000),
			conversation_id: conversationId ?? -1,
			sender: 'user',
			text: content,
			sequence_num: userSequence,
			job_sequence_id: null,
			created_at: new Date().toISOString(),
		};
		const working = upsertItem(itemsRef.current, userMessage);
		setItems(working);
		setPendingItems((prev) => [...prev, userMessage]);
		setLocalSequenceCounter(userSequence);
		setSelectedJobSequence(null);
		setHighlightedJobSequence(null);
		itemsRef.current = working;
		localSeqRef.current = userSequence;
	}, [conversationId]);

	const appendBotReply = useCallback((text: string, cards: ChatJobCard[]) => {
		const botText = text.trim() || 'Here are some matching jobs for you.';
		let currentSequence = localSeqRef.current + 1;
		const botMessage: ConversationMessageItem = {
			type: 'message',
			id: -Date.now() - 2000 - Math.floor(Math.random() * 1000),
			conversation_id: conversationId ?? -1,
			sender: 'llm',
			text: botText,
			sequence_num: currentSequence,
			job_sequence_id: null,
			created_at: new Date().toISOString(),
		};

		let working = upsertItem(itemsRef.current, botMessage);
		const toPersist: ConversationStreamItem[] = [botMessage];
		for (const card of cards || []) {
			currentSequence += 1;
			const jobItem: ConversationJobItem = {
				type: 'job',
				id: -Date.now() - Math.random(),
				conversation_id: conversationId ?? -1,
				job_json: card,
				sequence_num: currentSequence,
				created_at: new Date().toISOString(),
			};
			working = upsertItem(working, jobItem);
			toPersist.push(jobItem);
		}

		setItems(working);
		setPendingItems((prev) => [...prev, ...toPersist]);
		setLocalSequenceCounter(currentSequence);
		itemsRef.current = working;
		localSeqRef.current = currentSequence;
	}, [conversationId]);

	const playAudio = useCallback((audioData: Blob | ArrayBuffer) => {
		try {
			const blob = audioData instanceof Blob ? audioData : new Blob([audioData], { type: 'audio/wav' });
			const url = URL.createObjectURL(blob);
			const audio = new Audio(url);
			audio.play().catch(() => undefined);
			audio.onended = () => URL.revokeObjectURL(url);
		} catch {
			// ignore
		}
	}, []);

	const ensureVoiceSocket = useCallback(async () => {
		const existing = wsRef.current;
		if (existing && existing.readyState === WebSocket.OPEN) return existing;

		return await new Promise<WebSocket>((resolve, reject) => {
			const ws = new WebSocket(voiceWsUrl);
			wsRef.current = ws;
			let settled = false;
			const timeout = window.setTimeout(() => {
				if (settled) return;
				settled = true;
				try {
					ws.close();
				} catch {
					// ignore
				}
				reject(new Error('Voice server timeout. Please try again.'));
			}, VOICE_WS_CONNECT_TIMEOUT_MS);

			ws.onopen = () => {
				if (settled) return;
				settled = true;
				window.clearTimeout(timeout);
				resolve(ws);
			};

			ws.onmessage = (event) => {
				if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
					playAudio(event.data);
					return;
				}
				if (typeof event.data !== 'string') return;

				let data: VoiceSocketMessage;
				try {
					data = JSON.parse(event.data) as VoiceSocketMessage;
				} catch {
					return;
				}

				if (data.type === 'transcription' && data.text) {
					appendUserMessage(data.text);
				}
				if (data.type === 'response') {
					appendBotReply(data.message || '', data.jobs || []);
					setLoadingReply(false);
				}
				if (data.type === 'error') {
					setLoadingReply(false);
					setToast({ message: data.message || 'Voice request failed.', type: 'error' });
				}
			};

			ws.onerror = () => {
				if (settled) return;
				settled = true;
				window.clearTimeout(timeout);
				setLoadingReply(false);
				reject(new Error('Voice websocket connection failed.'));
			};

			ws.onclose = () => {
				wsRef.current = null;
				setIsVoiceListening(false);
				isVoiceListeningRef.current = false;
				if (!settled) {
					settled = true;
					window.clearTimeout(timeout);
					reject(new Error('Voice websocket closed before connecting.'));
				}
			};
		});
	}, [appendBotReply, appendUserMessage, playAudio, voiceWsUrl]);

	const stopVoiceCapture = useCallback(async (sendEnd: boolean) => {
		isVoiceListeningRef.current = false;
		setIsVoiceListening(false);
		clearSilenceTimer();

		if (processorRef.current) {
			processorRef.current.disconnect();
			processorRef.current.onaudioprocess = null;
			processorRef.current = null;
		}
		if (sourceRef.current) {
			sourceRef.current.disconnect();
			sourceRef.current = null;
		}
		if (audioContextRef.current) {
			await audioContextRef.current.close();
			audioContextRef.current = null;
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}

		if (sendEnd && hasSpokenRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ action: 'end' }));
			setLoadingReply(true);
			hasSpokenRef.current = false;
		}
	}, [clearSilenceTimer]);

	const startVoiceCapture = useCallback(async () => {
		if (loadingReplyRef.current || isVoiceListeningRef.current) return;

		try {
			await ensureVoiceSocket();
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AudioContextClass) throw new Error('AudioContext is not supported.');

			const audioContext = new AudioContextClass({ sampleRate: 16000 });
			const source = audioContext.createMediaStreamSource(stream);
			const processor = audioContext.createScriptProcessor(4096, 1, 1);

			processor.onaudioprocess = (event) => {
				if (!isVoiceListeningRef.current) return;
				const floatData = event.inputBuffer.getChannelData(0);
				const silent = detectSilence(floatData);

				if (!silent) {
					lastSoundTimeRef.current = Date.now();
					hasSpokenRef.current = true;
					clearSilenceTimer();
				} else if (hasSpokenRef.current && silenceTimerRef.current === null) {
					silenceTimerRef.current = window.setTimeout(() => {
						if (Date.now() - lastSoundTimeRef.current >= VOICE_SILENCE_DURATION) {
							stopVoiceCapture(true).catch(() => undefined);
						}
					}, VOICE_SILENCE_DURATION);
				}

				const pcm16 = float32ToPCM16(floatData);
				if (wsRef.current?.readyState === WebSocket.OPEN) {
					wsRef.current.send(pcm16);
				}
			};

			source.connect(processor);
			processor.connect(audioContext.destination);

			streamRef.current = stream;
			audioContextRef.current = audioContext;
			sourceRef.current = source;
			processorRef.current = processor;

			hasSpokenRef.current = false;
			lastSoundTimeRef.current = Date.now();
			isVoiceListeningRef.current = true;
			setIsVoiceListening(true);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Microphone access failed.';
			setToast({ message, type: 'error' });
			await stopVoiceCapture(false);
		}
	}, [clearSilenceTimer, detectSilence, ensureVoiceSocket, float32ToPCM16, stopVoiceCapture]);

	async function handleClose() {
		await stopVoiceCapture(false);
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.close();
		}
		// Save pending items before closing
		await savePendingItems();
		onClose();
	}

	async function startNewConversation() {
		await stopVoiceCapture(false);
		// Save pending items before starting new conversation
		await savePendingItems();
		setConversationId(null);
		removeConversationId();
		setItems([]);
		setPendingItems([]);
		setLocalSequenceCounter(0);
		setSelectedJobSequence(null);
		setHighlightedJobSequence(null);
	}

	async function selectConversation(id: number) {
		await stopVoiceCapture(false);
		// Save pending items before switching conversations
		await savePendingItems();
		setConversationId(id);
		persistConversationId(id);
		setItems([]);
		setPendingItems([]);
		setLocalSequenceCounter(0);
		setSelectedJobSequence(null);
		setHighlightedJobSequence(null);
	}

	return (
		<div className="relative w-full max-w-5xl h-[85vh] max-h-[820px] rounded-2xl bg-[#1A1A1D] border border-white/10 shadow-2xl flex flex-col">
			<div className="flex items-center justify-between p-4 border-b border-white/10">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-[#6A1E55] flex items-center justify-center">
						<span className="text-white text-lg">🤖</span>
					</div>
					<div>
						<h2 className="text-white font-semibold">Job Assistant</h2>
						<p className="text-white/60 text-sm">Share your dream role</p>
					</div>
				</div>
				<button
					onClick={handleClose}
					className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
				>
					✕
				</button>
			</div>

			<div className="flex-1 flex overflow-hidden">
				{/* Sidebar for conversation history */}
				<div className="w-64 border-r border-white/10 bg-black/10 flex flex-col">
					<div className="p-3 flex items-center justify-between">
						<h3 className="text-white text-sm font-semibold">Recent chats</h3>
						<button
							type="button"
							onClick={startNewConversation}
							className="text-xs px-2 py-1 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors"
						>
							New
						</button>
					</div>
					<div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar px-2 pb-2">
						{conversations.length === 0 && (
							<p className="text-xs text-white/50 px-2">No previous chats</p>
						)}
						{conversations.map((conv) => (
							<button
								key={conv.id}
								onClick={() => selectConversation(conv.id)}
								className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
									conversationId === conv.id
										? 'border-[#6A1E55] bg-[#6A1E55]/30 text-white'
										: 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
								}`}
							>
								<div className="font-semibold">Chat #{conv.id}</div>
								<div className="text-xs text-white/60">
									Updated: {new Date(conv.updated_at).toLocaleString()}
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Main chat area */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
					<ConversationLoader conversationId={conversationId} onLoaded={handleConversationLoaded} />

					{renderedItems.map((item) =>
						item.type === 'message' ? (
							<MessageBubble
								key={`message-${item.id}`}
								message={item}
								isOwn={item.sender === 'user'}
								isJobHighlighted={Boolean(item.job_sequence_id && item.job_sequence_id === highlightedJobSequence)}
								onJumpToJob={item.job_sequence_id ? handleJumpToJob : undefined}
							/>
						) : (
							<div id={`job-sequence-${item.sequence_num}`} key={`job-${item.id}`}>
								<JobCard
									job={item}
									onSave={saveJobToFavorites}
									onSelect={handleSelectJob}
									isSelected={selectedJobSequence === item.sequence_num}
									isReferenced={jobReferenceMap.has(item.sequence_num)}
									isHighlighted={highlightedJobSequence === item.sequence_num}
								/>
							</div>
						),
					)}

					{loadingReply && (
						<div className="flex justify-start">
							<div className="bg-white/10 text-white/90 rounded-2xl px-4 py-3">
								<div className="flex gap-2">
									<div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
									<div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
									<div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
								</div>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{toast && (
				<div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
					<div
						className={`px-6 py-3 rounded-lg shadow-xl backdrop-blur-sm ${
							toast.type === 'success'
								? 'bg-emerald-600/90 text-white border border-emerald-400/50'
								: 'bg-red-600/90 text-white border border-red-400/50'
						} animate-in slide-in-from-bottom-4 duration-300`}
					>
						<div className="flex items-center gap-2">
							<span>{toast.type === 'success' ? '✓' : '✕'}</span>
							<span className="font-medium">{toast.message}</span>
						</div>
					</div>
				</div>
			)}

			<div className="p-4 border-t border-white/10 space-y-3">
				{selectedJobSequence && (
					<div className="flex items-center justify-between text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
						<span>Referencing job #{selectedJobSequence}</span>
						<button
							type="button"
							className="text-xs px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/40 transition-colors"
							onClick={() => {
								setSelectedJobSequence(null);
								setHighlightedJobSequence(null);
							}}
						>
							Clear
						</button>
					</div>
				)}

				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleInputKey}
						placeholder="Describe the job you're looking for..."
						className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 outline-none focus:border-[#6A1E55] transition-colors"
						disabled={loadingReply}
					/>
					<button
						type="button"
						onClick={() => {
							startVoiceCapture().catch(() => undefined);
						}}
						disabled={loadingReply || isVoiceListening}
						className="px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isVoiceListening ? 'Listening...' : 'Start Voice'}
					</button>
					<button
						onClick={handleSend}
						disabled={loadingReply || !input.trim()}
						className="px-6 py-3 rounded-lg bg-[#6A1E55] text-white font-semibold hover:bg-[#7A2E65] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Send
					</button>
				</div>
			</div>
		</div>
	);
};

export default ChatWindow;