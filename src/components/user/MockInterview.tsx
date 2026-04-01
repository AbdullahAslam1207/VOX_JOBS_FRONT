import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStoredUser } from '../../api';

type InterviewServerMessage = {
  type?: string;
  message?: string;
  target_field?: string;
  text?: string;
  rounds_done?: number;
  max_rounds?: number;
  score?: number;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
};

type ChatMessage = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
};

type ScorePayload = {
  score?: number;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
};

const SILENCE_DURATION = 1800;
const AUDIO_THRESHOLD = 0.01;
const MOCK_INTERVIEW_WS_PATH = '/ws/mock_interview_voice';

export default function MockInterview() {
  const [socketState, setSocketState] = useState<'connected' | 'disconnected'>('disconnected');
  const [statusText, setStatusText] = useState('Ready. Start an interview first.');
  const [targetField, setTargetField] = useState('');
  const [maxRounds, setMaxRounds] = useState(5);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [scoreCard, setScoreCard] = useState<ScorePayload | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());
  const hasSpokenRef = useRef(false);
  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  const userEmail = useMemo(() => (getStoredUser()?.email || '').trim(), []);

  const wsUrl = useMemo(() => {
    const explicitSocketUrl = (import.meta.env.VITE_MOCK_INTERVIEW_WS_URL as string | undefined)?.trim();
    const explicitBase = (import.meta.env.VITE_MOCK_INTERVIEW_BASE_URL as string | undefined)?.trim();
    const backendHttp = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() || 'http://localhost:8000';
    const withUserEmail = (rawUrl: string) => {
      if (!userEmail) return rawUrl;
      const separator = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${separator}User_Email=${encodeURIComponent(userEmail)}`;
    };

    const normalizeSocketUrl = (rawUrl: string) => {
      try {
        const parsed = new URL(rawUrl);
        const protocol = parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
          ? parsed.protocol
          : parsed.protocol === 'https:'
            ? 'wss:'
            : 'ws:';
        const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : MOCK_INTERVIEW_WS_PATH;
        const query = parsed.search || '';
        return `${protocol}//${parsed.host}${path}${query}`;
      } catch {
        return rawUrl;
      }
    };

    if (explicitSocketUrl) {
      try {
        return withUserEmail(normalizeSocketUrl(explicitSocketUrl));
      } catch {
        // Fall through to host-based URL construction.
      }
    }

    const baseUrl = (explicitBase || backendHttp).replace(/\/+$/, '');
    try {
      const parsed = new URL(baseUrl);
      const wsProtocol = parsed.protocol === 'wss:' || parsed.protocol === 'ws:'
        ? parsed.protocol
        : parsed.protocol === 'https:'
          ? 'wss:'
          : 'ws:';
      const baseSocketUrl = `${wsProtocol}//${parsed.host}${MOCK_INTERVIEW_WS_PATH}`;
      return withUserEmail(baseSocketUrl);
    } catch {
      const fallbackUrl = `ws://localhost:8000${MOCK_INTERVIEW_WS_PATH}`;
      return withUserEmail(fallbackUrl);
    }
  }, [userEmail]);

  useEffect(() => {
    if (!chatAreaRef.current) return;
    chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
  }, [messages, scoreCard]);

  const updateStatus = useCallback((msg: string) => {
    setStatusText(msg);
  }, []);

  const addMessage = useCallback((text: string, sender: 'user' | 'bot') => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sender,
        text,
      },
    ]);
  }, []);

  const playAudio = useCallback((audioData: Blob | ArrayBuffer) => {
    try {
      const blob = audioData instanceof Blob ? audioData : new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch(() => undefined);
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      // Ignore playback errors because text responses still arrive.
    }
  }, []);

  const sendSocketJson = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const message = userEmail ? { ...payload, User_Email: userEmail } : payload;
    ws.send(JSON.stringify(message));
  }, [userEmail]);

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
    return rms < AUDIO_THRESHOLD;
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const endCurrentAnswer = useCallback(() => {
    if (!hasSpokenRef.current) return;
    sendSocketJson({ action: 'end' });
    updateStatus('Processing answer...');
    hasSpokenRef.current = false;
    clearSilenceTimer();
  }, [clearSilenceTimer, sendSocketJson, updateStatus]);

  const releaseAudioNodes = useCallback(async () => {
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
  }, [clearSilenceTimer]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);

    await releaseAudioNodes();

    if (hasSpokenRef.current) {
      sendSocketJson({ action: 'end' });
      hasSpokenRef.current = false;
    }

    updateStatus('Waiting for interviewer response...');
  }, [releaseAudioNodes, sendSocketJson, updateStatus]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      updateStatus('WebSocket is not connected yet. Please wait for connection.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser.');
      }

      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) return;
        const floatData = event.inputBuffer.getChannelData(0);
        const silent = detectSilence(floatData);

        if (!silent) {
          lastSoundTimeRef.current = Date.now();
          hasSpokenRef.current = true;
          clearSilenceTimer();
        } else if (hasSpokenRef.current && silenceTimerRef.current === null) {
          silenceTimerRef.current = window.setTimeout(() => {
            if (Date.now() - lastSoundTimeRef.current >= SILENCE_DURATION) {
              endCurrentAnswer();
            }
          }, SILENCE_DURATION);
        }

        const pcm16 = float32ToPCM16(floatData);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
      isRecordingRef.current = true;
      setIsRecording(true);
      updateStatus('Listening... speak your answer.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown microphone error.';
      updateStatus(`Microphone error: ${message}`);
      await releaseAudioNodes();
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [clearSilenceTimer, detectSilence, endCurrentAnswer, float32ToPCM16, releaseAudioNodes, updateStatus]);

  const connectWebSocket = useCallback(() => {
    updateStatus(`Connecting to ${wsUrl} ...`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setSocketState('connected');
      updateStatus('Connected. Enter a target field and start interview.');
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        playAudio(event.data);
        return;
      }

      if (event.data instanceof ArrayBuffer) {
        playAudio(event.data);
        return;
      }

      if (typeof event.data !== 'string') return;

      let data: InterviewServerMessage;
      try {
        data = JSON.parse(event.data) as InterviewServerMessage;
      } catch {
        return;
      }

      if (data.type === 'status' && data.message) updateStatus(data.message);
      if (data.type === 'error' && data.message) updateStatus(`Error: ${data.message}`);

      if (data.type === 'interview_started') {
        addMessage(`Interview started for: ${data.target_field || 'General'}`, 'bot');
        if (data.message) addMessage(data.message, 'bot');
        updateStatus('Interview started. Click Start Speaking to answer.');
        setScoreCard(null);
      }

      if (data.type === 'transcription' && data.text) {
        addMessage(data.text, 'user');
      }

      if (data.type === 'response') {
        if (data.message) addMessage(data.message, 'bot');
        if (typeof data.rounds_done === 'number' && typeof data.max_rounds === 'number') {
          updateStatus(`Round ${data.rounds_done}/${data.max_rounds}`);
        }
      }

      if (data.type === 'interview_complete') {
        if (data.message) addMessage(data.message, 'bot');
        setScoreCard({
          score: data.score,
          summary: data.summary,
          strengths: data.strengths,
          improvements: data.improvements,
        });
        updateStatus('Interview completed.');
        await stopRecording();
      }
    };

    ws.onclose = (event) => {
      setSocketState('disconnected');
      const reason = event.reason ? ` reason: ${event.reason}` : '';
      updateStatus(`Socket disconnected (code: ${event.code}). Reconnecting...${reason}`);
      window.setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 1500);
    };

    ws.onerror = () => {
      updateStatus(`WebSocket connection failed for ${wsUrl}. Verify tunnel allows WS upgrade and route path.`);
    };
  }, [addMessage, playAudio, stopRecording, updateStatus, wsUrl]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      stopRecording().catch(() => undefined);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
      }
    };
  }, [connectWebSocket, stopRecording]);

  const startInterview = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      updateStatus('WebSocket is not connected yet. Please wait for connection.');
      return;
    }

    setMessages([]);
    setScoreCard(null);
    sendSocketJson({
      action: 'start_interview',
      target_field: targetField.trim() || 'General',
      max_rounds: maxRounds,
    });
  };

  const finishInterview = () => {
    sendSocketJson({ action: 'finish_interview' });
    updateStatus('Finishing interview and generating score...');
  };

  const clearSession = async () => {
    await stopRecording();
    sendSocketJson({ action: 'clear' });
    setMessages([]);
    setScoreCard(null);
    updateStatus('Session cleared.');
  };

  return (
    <div className="p-6 md:p-8 text-white/90">
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(19,16,34,0.82), rgba(29,22,41,0.75))' }}>
        <div className="px-5 py-4 border-b border-white/10 bg-black/10 flex items-center justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-semibold">Mock Interview Voice Test</h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              socketState === 'connected'
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                : 'bg-red-500/20 text-red-200 border-red-400/30'
            }`}
          >
            {socketState === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="grid md:grid-cols-[1fr_150px_180px] gap-3 p-4 md:p-5 border-b border-white/10 bg-black/5">
          <input
            value={targetField}
            onChange={(event) => setTargetField(event.target.value)}
            placeholder="Target field (e.g. Data Scientist, Backend Engineer)"
            className="px-3 py-2.5 rounded-lg border border-white/15 bg-[#171325] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#A64D79]/60"
          />
          <select
            value={maxRounds}
            onChange={(event) => setMaxRounds(Number(event.target.value))}
            className="px-3 py-2.5 rounded-lg border border-white/15 bg-[#171325] text-white focus:outline-none focus:ring-2 focus:ring-[#A64D79]/60"
          >
            <option value={3}>3 rounds</option>
            <option value={5}>5 rounds</option>
            <option value={7}>7 rounds</option>
          </select>
          <button
            onClick={startInterview}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-[#6A1E55] hover:bg-[#7A2E65] transition-colors"
          >
            Start Interview
          </button>
        </div>

        <div ref={chatAreaRef} className="h-[420px] md:h-[470px] overflow-y-auto p-4 md:p-5 space-y-3 bg-black/5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] md:max-w-[76%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-[#2c2141] border border-[#5f3f85]/40 text-white'
                    : 'bg-[#161224] border border-white/15 text-white/90'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {scoreCard && (
            <div className="flex justify-start">
              <div className="max-w-[82%] md:max-w-[76%] px-4 py-3 rounded-xl bg-[#161224] border border-white/15 text-sm">
                <h4 className="font-semibold text-base mb-2">Final Score: {scoreCard.score ?? 0}/100</h4>
                <div>
                  <strong>Summary:</strong> {scoreCard.summary || 'No summary available.'}
                </div>
                <div className="mt-3 font-semibold">Strengths</div>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-white/85">
                  {(scoreCard.strengths || []).map((item) => (
                    <li key={`strength-${item}`}>{item}</li>
                  ))}
                  {(!scoreCard.strengths || scoreCard.strengths.length === 0) && <li>No strengths returned.</li>}
                </ul>
                <div className="mt-3 font-semibold">Improvements</div>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-white/85">
                  {(scoreCard.improvements || []).map((item) => (
                    <li key={`improvement-${item}`}>{item}</li>
                  ))}
                  {(!scoreCard.improvements || scoreCard.improvements.length === 0) && <li>No improvements returned.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-y border-white/10 bg-cyan-400/10 text-cyan-100 text-sm">{statusText}</div>

        <div className="flex flex-wrap gap-3 p-4 md:p-5">
          <button
            onClick={() => {
              if (!isRecording) {
                startRecording().catch(() => undefined);
                return;
              }
              stopRecording().catch(() => undefined);
            }}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${
              isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isRecording ? 'Stop Speaking' : 'Start Speaking'}
          </button>
          <button
            onClick={finishInterview}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Finish Interview
          </button>
          <button
            onClick={() => {
              clearSession().catch(() => undefined);
            }}
            className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-slate-600 hover:bg-slate-500 transition-colors"
          >
            Clear Session
          </button>
        </div>
      </div>
    </div>
  );
}