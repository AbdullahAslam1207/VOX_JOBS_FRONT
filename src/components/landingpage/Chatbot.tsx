import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse, getVoiceWebSocketUrl, ChatJobCard, ChatMessage } from '../../api';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  cards?: ChatJobCard[];
}

const CHAT_SESSIONS_KEY = 'voxjobs_chat_sessions';
const CHAT_HISTORY_KEY = 'voxjobs_chat_history'; // legacy migration

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const DEFAULT_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'bot',
    text: "Hello! I'm here to help you find jobs. What kind of job are you looking for?",
  },
];

function loadSessions(): Record<string, Omit<ChatSession, 'id'>> {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
    // Migrate old single chat history to one session
    const legacy = localStorage.getItem(CHAT_HISTORY_KEY);
    if (legacy) {
      try {
        const arr = JSON.parse(legacy);
        if (Array.isArray(arr) && arr.length > 0) {
          const id = Date.now().toString();
          const firstUser = arr.find((m: Message) => m.type === 'user');
          const title = firstUser?.text?.slice(0, 40) || 'Previous chat';
          const session = { title, messages: arr, updatedAt: Date.now() };
          localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify({ [id]: session }));
          localStorage.removeItem(CHAT_HISTORY_KEY);
          return { [id]: session };
        }
      } catch (_) {}
    }
  } catch (_) {}
  return {};
}

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [sessions, setSessions] = useState<Record<string, Omit<ChatSession, 'id'>>>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('Voice assistant ready.');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isRecordingRef = useRef(false);
  const hasSpokenRef = useRef(false);
  const lastSoundTimeRef = useRef(0);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SILENCE_DURATION = 2000;
  const AUDIO_THRESHOLD = 0.01;
  const newChatHasSessionRef = useRef(false);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // When switching to a session, load its messages
  useEffect(() => {
    if (activeSessionId && sessions[activeSessionId]) {
      setMessages(sessions[activeSessionId].messages);
    } else if (activeSessionId === null) {
      setMessages(DEFAULT_MESSAGES);
      newChatHasSessionRef.current = false;
    }
  }, [activeSessionId]); // only run when user switches; don't depend on sessions to avoid overwriting

  // Persist: update active session with current messages, or create new session when user sends first message in "new chat"
  useEffect(() => {
    if (activeSessionId) {
      const firstUser = messages.find((m) => m.type === 'user');
      const title = firstUser?.text?.slice(0, 40) || 'Chat';
      setSessions((prev) => {
        const next = { ...prev, [activeSessionId]: { title, messages, updatedAt: Date.now() } };
        try {
          localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save chat sessions', e);
        }
        return next;
      });
    }
  }, [messages, activeSessionId]);

  // When user sends first message in "new chat", create a new session (once)
  useEffect(() => {
    if (activeSessionId !== null) {
      newChatHasSessionRef.current = false;
      return;
    }
    const firstUser = messages.find((m) => m.type === 'user');
    if (!firstUser || newChatHasSessionRef.current) return;
    newChatHasSessionRef.current = true;
    const id = Date.now().toString();
    const title = firstUser.text?.slice(0, 40) || 'New chat';
    setSessions((prev) => {
      const next = { ...prev, [id]: { title, messages, updatedAt: Date.now() } };
      try {
        localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save chat sessions', e);
      }
      return next;
    });
    setActiveSessionId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Auto-connect voice WebSocket when dashboard loads (so it's ready when user opens chat)
  useEffect(() => {
    ensureWebSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up audio and WebSocket on unmount or when chatbot closes
  useEffect(() => {
    return () => {
      stopRecording(false);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse bot response to extract cards from __CARDS__ marker
  function parseBotResponse(botResponse: string): { text: string; cards: ChatJobCard[] } {
    const cardsMarker = '__CARDS__';
    const cardsIndex = botResponse.indexOf(cardsMarker);
    
    if (cardsIndex === -1) {
      return { text: botResponse.trim(), cards: [] };
    }

    const text = botResponse.substring(0, cardsIndex).trim();
    let cardsPart = botResponse.substring(cardsIndex + cardsMarker.length).trim();
    
    // Try to parse the cards array
    let cards: ChatJobCard[] = [];
    try {
      // Remove leading/trailing whitespace
      cardsPart = cardsPart.trim();
      
      // If it starts with [, try to parse as JSON array
      if (cardsPart.startsWith('[')) {
        cards = JSON.parse(cardsPart);
      } else if (cardsPart) {
        // If it doesn't start with [, wrap it in brackets
        cards = JSON.parse(`[${cardsPart}]`);
      }
    } catch (e) {
      console.error('Failed to parse cards:', e, 'Raw cards part:', cardsPart);
    }

    return { text, cards: Array.isArray(cards) ? cards : [] };
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build conversation history from previous messages (excluding initial bot message)
      // Format: [{ userMessage: string, botResponse: string }, ...]
      const conversationHistory: ChatMessage[] = [];
      
      // Start from index 1 to skip the initial bot greeting
      for (let i = 1; i < messages.length; i += 2) {
        const userMsg = messages[i];
        const botMsg = messages[i + 1];
        
        if (userMsg && userMsg.type === 'user' && botMsg && botMsg.type === 'bot') {
          // Build bot response string with message and jobs
          let botResponseText = botMsg.text;
          
          // If there are job cards, format them as JSON string with __CARDS__ marker
          if (botMsg.cards && botMsg.cards.length > 0) {
            botResponseText += '\n\n__CARDS__ ' + JSON.stringify(botMsg.cards);
          } else {
            botResponseText += '\n\n__CARDS__ []';
          }
          
          conversationHistory.push({
            userMessage: userMsg.text,
            botResponse: botResponseText,
          });
        }
      }
      
      // Send request with query and conversation history
      const response = await getChatResponse(userMessage, conversationHistory);
      
      // Parse the response - handle both structured format and message with __CARDS__ marker
      let messageText = '';
      let cards: ChatJobCard[] = [];
      
      if (response && response.response) {
        // Structured format: { response: { message: string, jobs: ChatJobCard[] }, status: number }
        messageText = response.response.message || '';
        cards = response.response.jobs || [];
        
        // If message contains __CARDS__ marker, parse it (cards might be in message string)
        if (messageText.includes('__CARDS__')) {
          const parsed = parseBotResponse(messageText);
          messageText = parsed.text;
          // Use parsed cards if available, otherwise use jobs from response
          cards = parsed.cards.length > 0 ? parsed.cards : cards;
        }
      } else if (typeof response === 'string') {
        // Direct string response with __CARDS__ marker
        const parsed = parseBotResponse(response);
        messageText = parsed.text;
        cards = parsed.cards;
      }
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: messageText,
        cards: cards.length > 0 ? cards : undefined,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Normalize job object from backend (handles title/job_title, company/company_name, etc.)
  function normalizeJobCard(raw: Record<string, unknown>): ChatJobCard {
    return {
      title: (raw.title || raw.job_title || '') as string,
      company_name: (raw.company_name || raw.company || '') as string,
      location: (raw.location || '') as string,
      city: (raw.city || '') as string,
      salary: (raw.salary || raw.salary_range || '') as string,
      job_type: (raw.job_type || raw.type || '') as string,
      experience: (raw.experience || '') as string,
      education: (raw.education || '') as string,
      posted_date: (raw.posted_date || '') as string,
      apply_before: (raw.apply_before || '') as string,
      apply_link: (raw.apply_link || '') as string,
      job_description: (raw.job_description || raw.description || '') as string,
      skills: (raw.skills || '') as string,
      job_link: (raw.job_link || raw.url || raw.job_url || raw.link || '') as string,
    };
  }

  // Voice chat: establish WebSocket connection
  function ensureWebSocket() {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = getVoiceWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsVoiceConnected(true);
        setVoiceStatus('Connected. Click Start Speaking.');
      };

      ws.onclose = () => {
        setIsVoiceConnected(false);
        setVoiceStatus('Disconnected from voice assistant.');
      };

      ws.onerror = () => {
        setIsVoiceConnected(false);
        setVoiceStatus('Voice connection error.');
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
          playAudio(event.data);
          return;
        }

        try {
          const data = JSON.parse(event.data as string);

          if (data.type === 'status') {
            if (typeof data.message === 'string') {
              setVoiceStatus(data.message);
            }
          }

          if (data.type === 'transcription' && typeof data.text === 'string') {
            const userMsg: Message = {
              id: Date.now().toString(),
              type: 'user',
              text: data.text,
            };
            setMessages((prev) => [...prev, userMsg]);
          }

          if (data.type === 'response') {
            const rawMessage: string = data.message || '';
            const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
            const jobs: ChatJobCard[] = rawJobs.map((j: Record<string, unknown>) => normalizeJobCard(j));

            let messageText = rawMessage;
            let cards: ChatJobCard[] = jobs;

            if (messageText.includes('__CARDS__')) {
              const parsed = parseBotResponse(messageText);
              messageText = parsed.text;
              if (parsed.cards.length > 0) {
                cards = parsed.cards.map((c) => normalizeJobCard(c as unknown as Record<string, unknown>));
              }
            }

            const botMsg: Message = {
              id: (Date.now() + 1).toString(),
              type: 'bot',
              text: messageText,
              cards: cards.length > 0 ? cards : undefined,
            };
            setMessages((prev) => [...prev, botMsg]);
          }

          if (data.type === 'error' && typeof data.message === 'string') {
            setVoiceStatus(`Error: ${data.message}`);
          }
        } catch (err) {
          console.error('Voice WS message parse error:', err);
        }
      };
    } catch (err) {
      console.error('Failed to open voice WebSocket:', err);
      setIsVoiceConnected(false);
      setVoiceStatus('Failed to connect to voice assistant.');
    }
  }

  // Float32 to PCM16 converter
  function float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return buffer;
  }

  function detectSilence(floatData: Float32Array): boolean {
    let sum = 0;
    for (let i = 0; i < floatData.length; i++) {
      sum += floatData[i] * floatData[i];
    }
    const rms = Math.sqrt(sum / floatData.length);
    return rms < AUDIO_THRESHOLD;
  }

  const handleSilenceDetectionRef = useRef(() => {
    if (!hasSpokenRef.current) return;
    const timeSinceLastSound = Date.now() - lastSoundTimeRef.current;
    if (timeSinceLastSound >= SILENCE_DURATION && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'end' }));
      setVoiceStatus('Processing your message...');
      hasSpokenRef.current = false;
      lastSoundTimeRef.current = Date.now();
      stopRecordingRef.current(false);
    }
  });
  const stopRecordingRef = useRef<(sendEnd: boolean) => void>(() => {});

  async function startRecording() {
    if (isRecording) return;

    ensureWebSocket();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      const inputNode = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      inputNodeRef.current = inputNode;
      processorRef.current = processor;
      isRecordingRef.current = true;
      hasSpokenRef.current = false;
      lastSoundTimeRef.current = Date.now();

      processor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) return;
        const floatData = event.inputBuffer.getChannelData(0);
        const isSilent = detectSilence(floatData);

        if (!isSilent) {
          lastSoundTimeRef.current = Date.now();
          hasSpokenRef.current = true;
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        } else if (hasSpokenRef.current) {
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              silenceTimeoutRef.current = null;
              handleSilenceDetectionRef.current();
            }, SILENCE_DURATION);
          }
        }

        const pcm16 = float32ToPCM16(floatData);
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(pcm16);
        }
      };

      inputNode.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setVoiceStatus('Listening... Speak now (auto-detects silence).');
    } catch (err: any) {
      console.error('Mic error:', err);
      setVoiceStatus(`Mic error: ${err?.message || 'Unable to access microphone.'}`);
    }
  }

  function stopRecording(sendEnd: boolean = true) {
    if (!isRecording && !audioContextRef.current && !mediaStreamRef.current) return;

    isRecordingRef.current = false;
    setIsRecording(false);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputNodeRef.current) {
      inputNodeRef.current.disconnect();
      inputNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (sendEnd && hasSpokenRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'end' }));
      setVoiceStatus('Processing your message...');
    } else {
      setVoiceStatus(isVoiceConnected ? 'Connected. Click Start Speaking.' : 'Voice assistant ready.');
    }
  }
  stopRecordingRef.current = stopRecording;

  function handleVoiceToggle() {
    if (isRecording) {
      stopRecording(true);
    } else {
      startRecording();
    }
  }

  function handleNewChat() {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'clear' }));
    }
    newChatHasSessionRef.current = false;
    setActiveSessionId(null);
    setMessages(DEFAULT_MESSAGES);
    setVoiceStatus('Voice assistant ready.');
  }

  function handleSelectSession(id: string) {
    if (sessions[id]) {
      setActiveSessionId(id);
      setMessages(sessions[id].messages);
    }
  }

  function handleClearChat() {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'clear' }));
    }
    setMessages(DEFAULT_MESSAGES);
    if (activeSessionId) {
      setSessions((prev) => {
        const next = { ...prev, [activeSessionId]: { ...prev[activeSessionId], messages: DEFAULT_MESSAGES, updatedAt: Date.now() } };
        try {
          localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save chat sessions', e);
        }
        return next;
      });
    }
    setVoiceStatus('Chat cleared. Ready.');
  }

  function playAudio(audioData: Blob | ArrayBuffer) {
    try {
      const blob = audioData instanceof Blob ? audioData : new Blob([audioData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.error('Audio play error:', err);
        setVoiceStatus(`Audio play failed: ${err?.message || 'Unknown error'}`);
      });
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setVoiceStatus(isVoiceConnected ? 'Connected. Click Start Speaking.' : 'Voice assistant ready.');
      };
    } catch (err: any) {
      console.error('Error playing audio:', err);
      setVoiceStatus(`Audio error: ${err?.message || 'Unknown error'}`);
    }
  }

  function saveJob(card: ChatJobCard) {
    try {
      const saved = localStorage.getItem('voxjobs_saved_jobs');
      const savedMap = saved ? JSON.parse(saved) : {};
      
      // Create a job object compatible with SavedJobs format
      const job = {
        id: card.job_link || Date.now().toString(),
        title: card.title,
        company: card.company_name,
        location: card.location || card.city || '',
        description: card.job_description || card.title,
        email: card.apply_link || undefined,
      };
      
      savedMap[job.id] = job;
      localStorage.setItem('voxjobs_saved_jobs', JSON.stringify(savedMap));
      
      setToast({ message: 'Job saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to save job:', error);
      setToast({ message: 'Failed to save job. Please try again.', type: 'error' });
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(106, 30, 85, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(106, 30, 85, 0.7);
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[85vh] max-h-[800px] rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden bg-[#1A1A1D]">
        {/* Left sidebar: all chats */}
        <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col bg-[#151518] rounded-l-2xl">
          <div className="p-3 border-b border-white/10">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#6A1E55] hover:bg-[#7A2E65] text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>+</span>
              <span>New chat</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="text-xs text-white/50 px-2 py-1.5 font-medium">All chats</div>
            {Object.entries(sessions)
              .sort(([, a], [, b]) => (b.updatedAt || 0) - (a.updatedAt || 0))
              .map(([id, session]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectSession(id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 truncate ${
                    activeSessionId === id
                      ? 'bg-[#6A1E55]/60 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                  title={session.title}
                >
                  {session.title || 'Chat'}
                </button>
              ))}
            {Object.keys(sessions).length === 0 && (
              <p className="text-white/40 text-xs px-2 py-2">No previous chats yet</p>
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 rounded-r-2xl bg-[#1A1A1D]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6A1E55] flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">Job Assistant</h2>
              <p className="text-white/60 text-sm">Ask me about jobs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.type === 'user'
                    ? 'bg-[#6A1E55] text-white'
                    : 'bg-white/10 text-white/90'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                
                {/* Job Cards */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {msg.cards.map((card, idx) => (
                      <JobCard key={idx} card={card} onSave={() => saveJob(card)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
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

        {/* Toast Notification */}
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

        {/* Input + Voice Controls */}
        <div className="p-4 border-t border-white/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#6A1E55] hover:bg-[#7A2E65] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? 'Listening (auto-sends after 2–3 sec silence)' : 'Start Speaking'}
              >
                <span>🎤</span>
                <span>{isRecording ? 'Listening...' : 'Start Speaking'}</span>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 outline-none focus:border-[#6A1E55] transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 rounded-lg bg-[#6A1E55] text-white font-semibold hover:bg-[#7A2E65] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="px-4 py-3 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 font-medium transition-colors"
                title="Clear chat"
              >
                🗑 Clear
              </button>
            </div>
            <div className="text-xs text-white/60 flex items-center justify-between">
              <span>{voiceStatus}</span>
              <span
                className={`flex items-center gap-1 ${
                  isVoiceConnected ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVoiceConnected ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                {isVoiceConnected ? 'Voice connected' : 'Voice disconnected'}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
    </>
  );
}

// Job Card Component
interface JobCardProps {
  card: ChatJobCard;
  onSave: () => void;
}

function JobCard({ card, onSave }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const location = card.location || card.city || '';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('voxjobs_saved_jobs');
      const savedMap = saved ? JSON.parse(saved) : {};
      const jobId = card.job_link || `${card.title}-${card.company_name}`;
      setIsSaved(!!savedMap[jobId]);
    } catch {
      setIsSaved(false);
    }
  }, [card.job_link, card.title, card.company_name]);

  function handleSave() {
    onSave();
    setIsSaved(true);
  }

  return (
    <div className="bg-gradient-to-br from-[#3B1C32]/95 to-[#2A1425]/95 border border-white/20 rounded-xl p-5 flex flex-col shadow-lg h-auto min-h-[350px]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="text-white font-bold text-base mb-1.5 leading-tight">{card.title}</h3>
          <p className="text-white/90 text-sm font-medium mb-1">{card.company_name}</p>
          {location && (
            <p className="text-white/70 text-xs">{location}</p>
          )}
        </div>
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 ${
            isSaved
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
              : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
          }`}
        >
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="space-y-2 mb-3 flex-1">
        {card.job_type && (
          <div className="text-white/80 text-xs bg-white/5 rounded-lg px-3 py-2">
            <span className="font-medium">Type: </span>
            <span>{card.job_type}</span>
          </div>
        )}
        {card.experience && card.experience !== 'N/A' && card.experience !== 'Not specified' && (
          <div className="text-white/80 text-xs bg-white/5 rounded-lg px-3 py-2">
            <span className="font-medium">Experience: </span>
            <span>{card.experience}</span>
          </div>
        )}
        {card.education && (
          <div className="text-white/80 text-xs bg-white/5 rounded-lg px-3 py-2">
            <span className="font-medium">Education: </span>
            <span>{card.education}</span>
          </div>
        )}
        {card.salary && card.salary !== 'Not mentioned' && (
          <div className="text-white/80 text-xs bg-white/5 rounded-lg px-3 py-2">
            <span className="font-medium">Salary: </span>
            <span>{card.salary}</span>
          </div>
        )}
      </div>

      {card.skills && card.skills !== 'Not mentioned' && card.skills.trim() && (
        <div className="mb-3">
          <h4 className="text-white/90 text-xs font-semibold mb-2">Skills Required</h4>
          <div className="flex flex-wrap gap-2">
            {card.skills.split(',').map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-[#6A1E55]/30 text-white/80 text-xs rounded-md border border-[#6A1E55]/50">
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-white/10 space-y-2">
        {card.posted_date && (
          <div className="text-xs text-white/60">
            <span className="font-medium">Posted: </span>
            <span>{card.posted_date}</span>
          </div>
        )}
        {card.apply_before && (
          <div className="text-xs text-amber-300/80">
            <span className="font-medium">Apply before: {card.apply_before}</span>
          </div>
        )}
        {card.job_link && (
          <a
            href={card.job_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#6A1E55] to-[#7A2E65] text-white text-sm font-semibold hover:from-[#7A2E65] hover:to-[#8A3E75] transition-all duration-200 mt-2"
          >
            View Job →
          </a>
        )}
      </div>
    </div>
  );
}

