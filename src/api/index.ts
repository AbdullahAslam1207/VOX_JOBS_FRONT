// Centralized API client for backend integration
const BASE_URL = 'https://6m8wrpjs-8000.inc1.devtunnels.ms';
const CHAT_BASE_URL = 'https://n5rrrx4s-8000.asse.devtunnels.ms';

// Centralized API endpoints - change these to update all API calls
export const API_ENDPOINTS = {
	AUTH: {
		REGISTER: '/auth/register',
		LOGIN: '/auth/login',
	},
	CRUD: {
		GET_JOBS: '/CRUD/Get_jobs',
		GET_JOBS_BY_CITY: '/CRUD/get_jobs_by_city',
		GET_JOBS_BY_TITLE: '/CRUD/get_jobs_by_title',
	},
	SCRAPER: {
		START_SCRAPER: '/Scraper/start_scraper',
	},
	CHAT: {
		CHAT_RESPONSE: '/chat_response_jobs',
	},
	VECTOR_STORE: {
		CREATE_VECTOR_STORE: 'https://n5rrrx4s-8000.asse.devtunnels.ms/create_vector_store',
	},
} as const;

export type UserRoleBackend = 'Admin' | 'Job_Seeker';

export interface RegisterRequest {
	fullname: string;
	email: string;
	password: string;
	role: UserRoleBackend;
}

export interface LoginRequest {
	email: string;
	password: string;
	role: UserRoleBackend;
}

export interface JobApi {
	id: string | number;
	title: string;
	company?: string;
	location?: string;
	description?: string;
	email?: string;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(init && init.headers ? init.headers : {}),
		},
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `Request failed: ${res.status}`);
	}
	// Some endpoints may return no JSON on success
	try {
		return (await res.json()) as T;
	} catch {
		return undefined as unknown as T;
	}
}

export function registerUser(data: RegisterRequest) {
	return jsonFetch(`${BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export function loginUser(data: LoginRequest) {
	return jsonFetch(`${BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export function getAllJobs(): Promise<JobApi[]> {
	return jsonFetch(`${BASE_URL}${API_ENDPOINTS.CRUD.GET_JOBS}`, { method: 'GET', cache: 'no-store' });
}

export function getJobsByCity(city: 'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi'): Promise<JobApi[]> {
	return jsonFetch(`${BASE_URL}${API_ENDPOINTS.CRUD.GET_JOBS_BY_CITY}`, {
		method: 'POST',
		body: JSON.stringify({ city }),
		cache: 'no-store',
	});
}

export function getJobsByTitle(title: string): Promise<JobApi[]> {
	const url = `${BASE_URL}${API_ENDPOINTS.CRUD.GET_JOBS_BY_TITLE}?title=${encodeURIComponent(title)}`;
	return jsonFetch(url, { method: 'GET', cache: 'no-store' });
}

export async function startScraperAndWait(): Promise<void> {
	// Fire the scraper and await completion (API returns 200 when done)
	await jsonFetch(`${BASE_URL}${API_ENDPOINTS.SCRAPER.START_SCRAPER}`, { method: 'GET', cache: 'no-store' });
}

export async function createVectorStore(): Promise<number> {
	// Trigger vector store creation; return HTTP status code for visibility
	const res = await fetch(API_ENDPOINTS.VECTOR_STORE.CREATE_VECTOR_STORE, { method: 'GET', cache: 'no-store' });
	console.log('Vector store response status:', res.status);
	// Do not throw to allow caller to inspect status code
	return res.status;
}

// Removed total users endpoint per requirements

export function mapUiRoleToBackend(uiRole: 'admin' | 'jobseeker'): UserRoleBackend {
	return uiRole === 'admin' ? 'Admin' : 'Job_Seeker';
}

// Chatbot API types
export interface ChatJobCard {
	title: string;
	company_name: string;
	location?: string;
	city?: string;
	salary?: string;
	job_type: string;
	experience?: string;
	education?: string;
	posted_date?: string;
	apply_before?: string;
	apply_link?: string;
	job_description?: string;
	skills?: string;
	job_link?: string;
}

export interface ChatMessage {
	userMessage: string;
	botResponse: string;
}

export interface ChatResponseData {
	message: string;
	jobs: ChatJobCard[];
}

export interface ChatResponse {
	response: ChatResponseData;
	status: number;
}

export interface ChatRequest {
	query: string;
	user_query: ChatMessage[];
}

export function getChatResponse(query: string, user_query: ChatMessage[] = []): Promise<ChatResponse> {
	return jsonFetch(`${CHAT_BASE_URL}${API_ENDPOINTS.CHAT.CHAT_RESPONSE}`, {
		method: 'POST',
		body: JSON.stringify({ query, user_query }),
		cache: 'no-store',
	});
}

// Voice chat WebSocket URL (derived from CHAT_BASE_URL)
export function getVoiceWebSocketUrl(): string {
	try {
		const url = new URL(CHAT_BASE_URL);
		url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
		url.pathname = '/ws/voice_chat';
		url.search = '';
		url.hash = '';
		return url.toString();
	} catch {
		const wsProtocol = CHAT_BASE_URL.startsWith('https') ? 'wss' : 'ws';
		const base = CHAT_BASE_URL.replace(/^https?/, '');
		return `${wsProtocol}${base}/ws/voice_chat`;
	}
}

