function normalizeBaseUrl(value: string | undefined, fallback: string): string {
	const base = value?.trim() || fallback;
	return base.replace(/\/+$/, '');
}

// Centralized API client for backend integration
const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL as string | undefined, 'http://localhost:8000');
const CHAT_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_CHAT_BACKEND_URL as string | undefined, BASE_URL);
const VECTOR_STORE_BASE_URL = normalizeBaseUrl(
	import.meta.env.VITE_VECTOR_STORE_URL as string | undefined,
	CHAT_BASE_URL
);
const USER_STORAGE_KEY = 'voxjobs_user';
const RECRUITER_TOKEN_STORAGE_KEY = 'voxjobs_recruiter_token';

// Centralized API endpoints - change these to update all API calls
export const API_ENDPOINTS = {
	AUTH: {
		REGISTER: '/auth/register',
		LOGIN: '/auth/login',
		PROFILE: '/auth/profile',
		PASSWORD: '/auth/password',
		USERS: '/auth/users',
	},
	RECRUITER: {
		SIGNUP: '/api/recruiter/signup',
		LOGIN: '/api/recruiter/login',
		JOB_SCHEMA: '/api/recruiter/job-schema',
		JOBS: '/api/recruiter/jobs',
	},
	JOBS: {
		CREATE: '/api/jobs/create',
		CLOSE: '/api/jobs',
		APPLICANTS: '/api/jobs',
	},
	CRUD: {
		GET_JOBS: '/CRUD/Get_jobs',
		GET_JOBS_BY_CITY: '/CRUD/get_jobs_by_city',
		GET_JOBS_BY_TITLE: '/CRUD/get_jobs_by_title',
	},
	FAVORITES: {
		ADD: '/CRUD/favorite/add',
		LIST: '/CRUD/favorite',
		DELETE: '/CRUD/favorite/delete',
	},
	SCRAPER: {
		START_SCRAPER: '/Scraper/start_scraper',
	},
	CHAT: {
		CHAT_RESPONSE: '/chat_response_jobs',
	},
	CONVERSATION: {
		MESSAGE: '/conversation/message',
		JOB: '/conversation/job',
		STREAM: '/conversation',
	},
	VECTOR_STORE: {
		CREATE_VECTOR_STORE: `${VECTOR_STORE_BASE_URL}/create_vector_store`,
	},
	APPLY: {
		RUN: '/apply/run',
		RUN_STATUS: '/apply/run',
		APPLIED_JOBS: '/apply/applied-jobs',
		RESUME_UPLOAD: '/apply/resume',
		RESUME_METADATA: '/apply/resume',
		PROFILE_PICTURE_UPLOAD: '/apply/profile-picture',
		PROFILE_PICTURE_METADATA: '/apply/profile-picture',
		MUSTAQBIL_CREDENTIALS: '/apply/mustaqbil-credentials',
	},
	RECOMMENDATIONS: {
		CV_RECOMMENDATIONS: '/cv_recommendations',
	},
} as const;

export type UserRoleBackend = 'Admin' | 'Job_Seeker' | 'Recruiter';

export interface RecruiterRegisterRequest {
	name: string;
	email: string;
	password: string;
	companyName: string;
	companyWebsite?: string;
}

export interface RecruiterLoginRequest {
	email: string;
	password: string;
}

export interface RecruiterAuthResponse {
	access_token: string;
	token_type: string;
	id: number;
	role: string;
	name: string;
	email: string;
	company_name?: string | null;
	company_website?: string | null;
}

export interface RecruiterJobSchemaField {
	name: string;
	label: string;
	field_type: 'text' | 'textarea' | 'checkbox' | 'number';
	required: boolean;
	max_length?: number | null;
	default?: string | null;
}

export interface RecruiterApplicant {
	name: string;
	email: string;
	resume_file_name?: string | null;
	resume_download_url?: string | null;
	applied_at?: string | null;
	status?: string | null;
	site?: string | null;
}

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

export interface UserProfileResponse {
	user_id: number;
	fullname: string;
	email: string;
	role: string;
}

export interface UpdateUserProfileRequest {
	current_email: string;
	fullname: string;
	email: string;
}

export interface UpdatePasswordRequest {
	email: string;
	current_password: string;
	new_password: string;
}

export interface UserListItemResponse {
	user_id: number;
	fullname: string;
	email: string;
	role: string;
	is_active: boolean;
}

export interface JobApi {
	id: string | number;
	title: string;
	company?: string;
	location?: string;
	description?: string;
	job_description?: string;
	email?: string;
	// Optional fields we may forward when saving favorites
	city?: string;
	source_city?: string;
	salary?: string;
	job_type?: string;
	job_shift?: string;
	experience?: string;
	education?: string;
	posted_date?: string;
	apply_before?: string;
	skills?: string;
	job_source?: string;
	job_link?: string;
	application_status?: string;
	recruiter_id?: number;
	applicants_count?: number;
}

// User session helpers
export interface StoredUser {
	user_id?: number;
	email?: string;
	fullname?: string;
	role?: string;
	company_name?: string;
	company_website?: string;
}

const PROFILE_STORAGE_KEY = 'voxjobs_profile';

export interface StoredProfile {
	fullname?: string;
	phone?: string;
	city?: string;
	bio?: string;
}

export function setStoredUser(user: StoredUser) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
	} catch {
		// ignore write errors
	}
}

export function getStoredUser(): StoredUser | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(USER_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as StoredUser) : null;
	} catch {
		return null;
	}
}

export function clearStoredUser() {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(USER_STORAGE_KEY);
		localStorage.removeItem(RECRUITER_TOKEN_STORAGE_KEY);
	} catch {
		// ignore
	}
}

export function setRecruiterToken(token: string) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(RECRUITER_TOKEN_STORAGE_KEY, token);
	} catch {
		// ignore write errors
	}
}

export function getRecruiterToken(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem(RECRUITER_TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function clearRecruiterToken() {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(RECRUITER_TOKEN_STORAGE_KEY);
	} catch {
		// ignore
	}
}

function getRecruiterAuthHeaders(): Record<string, string> {
	const token = getRecruiterToken();
	if (!token) return {};
	return { Authorization: `Bearer ${token}` };
}

export function getStoredProfile(): StoredProfile | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as StoredProfile) : null;
	} catch {
		return null;
	}
}

export function setStoredProfile(profile: StoredProfile) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
	} catch {
		// ignore write errors
	}
}

export function persistUserFromAuthResponse(res: any, fallbackEmail?: string): StoredUser | null {
	if (typeof window === 'undefined') return null;
	// Try to find the user object in common response shapes
	const candidate = res?.user ?? res?.data ?? res;
	const stored: StoredUser = {
		user_id: candidate?.user_id ?? candidate?.id ?? candidate?.userId,
		email: candidate?.email ?? res?.email ?? fallbackEmail,
		fullname: candidate?.fullname ?? candidate?.full_name ?? candidate?.name,
		role: candidate?.role ?? res?.role,
		company_name: candidate?.company_name ?? candidate?.companyName,
		company_website: candidate?.company_website ?? candidate?.companyWebsite,
	};

	if (stored.user_id || stored.email || stored.fullname) {
		setStoredUser(stored);
		return stored;
	}
	return null;
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
		throw new Error(parseApiError(text, res.status));
	}
	// Some endpoints may return no JSON on success
	try {
		return (await res.json()) as T;
	} catch {
		return undefined as unknown as T;
	}
}

function parseApiError(rawText: string, status: number): string {
	if (!rawText) return `Request failed: ${status}`;
	try {
		const parsed = JSON.parse(rawText);
		if (typeof parsed?.detail === 'string') return parsed.detail;
		if (Array.isArray(parsed?.detail)) return parsed.detail.map((d: any) => d?.msg || String(d)).join(', ');
		if (typeof parsed?.message === 'string') return parsed.message;
	} catch {
		// fallback to raw text
	}
	return rawText;
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

export async function registerRecruiter(data: RecruiterRegisterRequest) {
	const response = await jsonFetch<RecruiterAuthResponse>(`${BASE_URL}${API_ENDPOINTS.RECRUITER.SIGNUP}`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
	if (response?.access_token) {
		setRecruiterToken(response.access_token);
	}
	return response;
}

export async function loginRecruiter(data: RecruiterLoginRequest) {
	const response = await jsonFetch<RecruiterAuthResponse>(`${BASE_URL}${API_ENDPOINTS.RECRUITER.LOGIN}`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
	if (response?.access_token) {
		setRecruiterToken(response.access_token);
	}
	return response;
}

export function getUserProfile(email: string) {
	return jsonFetch<UserProfileResponse>(`${BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}/${encodeURIComponent(email)}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

export function updateUserProfile(data: UpdateUserProfileRequest) {
	return jsonFetch<UserProfileResponse>(`${BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export function updateUserPassword(data: UpdatePasswordRequest) {
	return jsonFetch<{ message: string }>(`${BASE_URL}${API_ENDPOINTS.AUTH.PASSWORD}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export function getAllUsers() {
	return jsonFetch<UserListItemResponse[]>(`${BASE_URL}${API_ENDPOINTS.AUTH.USERS}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

export function getAllJobs(): Promise<JobApi[]> {
	return jsonFetch(`${BASE_URL}${API_ENDPOINTS.CRUD.GET_JOBS}`, { method: 'GET', cache: 'no-store' });
}

export function getJobsPage(params: {
	limit: number;
	offset: number;
	query?: string;
	location?: string;
	city?: 'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi' | '';
	onlyRemote?: boolean;
}): Promise<JobApi[]> {
	const search = new URLSearchParams();
	search.set('limit', String(params.limit));
	search.set('offset', String(params.offset));
	if (params.query?.trim()) search.set('query', params.query.trim());
	if (params.location?.trim()) search.set('location', params.location.trim());
	if (params.city) search.set('city', params.city);
	if (params.onlyRemote) search.set('only_remote', 'true');
	return jsonFetch(`${BASE_URL}${API_ENDPOINTS.CRUD.GET_JOBS}?${search.toString()}`, {
		method: 'GET',
		cache: 'no-store',
	});
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

export function mapUiRoleToBackend(uiRole: 'admin' | 'jobseeker' | 'recruiter'): UserRoleBackend {
	if (uiRole === 'admin') return 'Admin';
	if (uiRole === 'recruiter') return 'Recruiter';
	return 'Job_Seeker';
}

export function getRecruiterJobSchema() {
	return jsonFetch<RecruiterJobSchemaField[]>(`${BASE_URL}${API_ENDPOINTS.RECRUITER.JOB_SCHEMA}`, {
		method: 'GET',
		headers: getRecruiterAuthHeaders(),
		cache: 'no-store',
	});
}

export function getRecruiterJobs() {
	return jsonFetch<{ jobs: JobApi[]; open_jobs: JobApi[]; closed_jobs: JobApi[] }>(
		`${BASE_URL}${API_ENDPOINTS.RECRUITER.JOBS}`,
		{
			method: 'GET',
			headers: getRecruiterAuthHeaders(),
			cache: 'no-store',
		}
	);
}

export function createRecruiterJob(payload: Record<string, any>) {
	return jsonFetch<JobApi>(`${BASE_URL}${API_ENDPOINTS.JOBS.CREATE}`, {
		method: 'POST',
		headers: getRecruiterAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export function updateRecruiterJob(jobId: number, payload: Record<string, any>) {
	return jsonFetch<JobApi>(`${BASE_URL}${API_ENDPOINTS.JOBS.CREATE.replace('/create', '')}/${jobId}`, {
		method: 'PATCH',
		headers: getRecruiterAuthHeaders(),
		body: JSON.stringify(payload),
	});
}

export function closeRecruiterJob(jobId: number) {
	return jsonFetch<JobApi>(`${BASE_URL}${API_ENDPOINTS.JOBS.CLOSE}/${jobId}/close`, {
		method: 'PATCH',
		headers: getRecruiterAuthHeaders(),
		cache: 'no-store',
	});
}

export function deleteRecruiterJob(jobId: number) {
	return jsonFetch<{ message: string }>(`${BASE_URL}${API_ENDPOINTS.JOBS.CREATE.replace('/create', '')}/${jobId}`, {
		method: 'DELETE',
		headers: getRecruiterAuthHeaders(),
		cache: 'no-store',
	});
}

export function getRecruiterApplicants(jobId: number) {
	return jsonFetch<RecruiterApplicant[]>(`${BASE_URL}${API_ENDPOINTS.JOBS.APPLICANTS}/${jobId}/applicants`, {
		method: 'GET',
		headers: getRecruiterAuthHeaders(),
		cache: 'no-store',
	});
}

// Favorites types and APIs
export interface FavoriteJobCreate {
	user_id: number;
	email: string;
	title: string;
	company_name?: string | null;
	company_link?: string | null;
	job_link?: string | null;
	location?: string | null;
	city?: string | null;
	source_city?: string | null;
	salary?: string | null;
	job_type?: string | null;
	job_shift?: string | null;
	experience?: string | null;
	education?: string | null;
	posted_date?: string | null;
	apply_before?: string | null;
	job_description?: string | null;
	skills?: string | null;
	job_source?: string | null;
	is_active?: boolean;
}

export interface FavoriteJobResponse extends FavoriteJobCreate {
	job_id: number;
	is_active: boolean;
}

export function addFavoriteJob(payload: FavoriteJobCreate) {
	return jsonFetch<{ message: string; favorite_id: number }>(`${BASE_URL}${API_ENDPOINTS.FAVORITES.ADD}`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function getFavoriteJobs(userId: number) {
	return jsonFetch<FavoriteJobResponse[]>(`${BASE_URL}${API_ENDPOINTS.FAVORITES.LIST}/${userId}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

export function deleteFavoriteJob(favId: number, userId: number) {
	return jsonFetch<{ message: string }>(`${BASE_URL}${API_ENDPOINTS.FAVORITES.DELETE}`, {
		method: 'DELETE',
		body: JSON.stringify({ fav_id: favId, user_id: userId }),
	});
}

// Chatbot API types
export interface ChatJobCard {
	title: string;
	company_name: string;
	location?: string;
	city?: string;
	salary?: string;
	job_type: string;
	job_shift?: string;
	experience?: string;
	education?: string;
	posted_date?: string;
	apply_before?: string;
	apply_link?: string;
	job_description?: string;
	skills?: string;
	job_link?: string;
	job_source?: string;
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

// The upstream expects kwargs/args envelope; keep backward compatibility with prior shape.
export function getChatResponse(query: string, user_query: ChatMessage[] = []): Promise<ChatResponse> {
	return jsonFetch(`${CHAT_BASE_URL}${API_ENDPOINTS.CHAT.CHAT_RESPONSE}`, {
		method: 'POST',
		body: JSON.stringify({ query, user_query }),
		cache: 'no-store',
	});
}

// Conversation persistence types
export type ConversationSender = 'user' | 'llm';

export interface MessageCreateRequest {
	conversation_id?: number | null;
	user_id?: number | null;
	sender: ConversationSender;
	text: string;
	job_sequence_id?: number | null;
}

export interface JobCreateRequest {
	conversation_id: number;
	job_json: Record<string, any>;
}

export interface ConversationMessageItem {
	type: 'message';
	id: number;
	conversation_id: number;
	sender: ConversationSender;
	text: string;
	sequence_num: number;
	job_sequence_id?: number | null;
	created_at: string;
}

export interface ConversationJobItem {
	type: 'job';
	id: number;
	conversation_id: number;
	job_json: Record<string, any>;
	sequence_num: number;
	created_at: string;
}

export type ConversationStreamItem = ConversationMessageItem | ConversationJobItem;

export interface ConversationStreamResponse {
	conversation_id: number;
	items: ConversationStreamItem[];
}

export interface ConversationSummary {
	id: number;
	user_id?: number | null;
	created_at: string;
	updated_at: string;
	last_sequence_num: number;
}

export interface ConversationListResponse {
	conversations: ConversationSummary[];
}

export function saveConversationMessage(payload: MessageCreateRequest) {
	return jsonFetch<ConversationMessageItem>(`${BASE_URL}${API_ENDPOINTS.CONVERSATION.MESSAGE}`, {
		method: 'POST',
		body: JSON.stringify(payload),
		cache: 'no-store',
	});
}

export function saveConversationJob(payload: JobCreateRequest) {
	return jsonFetch<ConversationJobItem>(`${BASE_URL}${API_ENDPOINTS.CONVERSATION.JOB}`, {
		method: 'POST',
		body: JSON.stringify(payload),
		cache: 'no-store',
	});
}

export function fetchConversation(conversationId: number) {
	return jsonFetch<ConversationStreamResponse>(`${BASE_URL}${API_ENDPOINTS.CONVERSATION.STREAM}/${conversationId}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

export function fetchConversations(userId?: number | null) {
	const qs = userId ? `?user_id=${userId}` : '';
	return jsonFetch<ConversationListResponse>(`${BASE_URL}${API_ENDPOINTS.CONVERSATION.STREAM}${qs}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

// Apply APIs
export interface ApplyRunRequest {
	email: string;
	url: string;
	job_title?: string;
	company_name?: string;
	job_id?: number;
}

export interface ApplyRunCreateResponse {
	run_id: number;
	status: string;
	site: string;
}

export interface PlatformApplyRequest {
	email: string;
	job_id: number;
}

export interface PlatformApplyResponse {
	application_id: number;
	status: string;
	message: string;
}

export interface ApplyRunStatusResponse {
	id: number;
	email: string;
	job_id?: number | null;
	url: string;
	site: string;
	status: string;
	stdout?: string | null;
	stderr?: string | null;
	created_at: string;
	started_at?: string | null;
	finished_at?: string | null;
}

export interface AppliedJobResponse {
	id: number;
	user_id: number;
	job_id?: number | null;
	email: string;
	site: string;
	job_url: string;
	job_title?: string | null;
	company_name?: string | null;
	status: string;
	run_id?: number | null;
	error_message?: string | null;
	applied_at?: string | null;
	created_at: string;
}

export interface AppliedJobListResponse {
	jobs: AppliedJobResponse[];
	total: number;
}

export interface ResumeUploadResponse {
	message: string;
	email: string;
	file_name: string;
	content_type: string;
	uploaded_at: string;
}

export interface ResumeMetadataResponse {
	email: string;
	file_name: string;
	content_type: string;
	file_size: number;
	uploaded_at: string;
	updated_at: string;
}

export interface ProfilePictureUploadResponse {
	message: string;
	email: string;
	file_name: string;
	content_type: string;
	uploaded_at: string;
}

export interface ProfilePictureMetadataResponse {
	email: string;
	file_name: string;
	content_type: string;
	file_size: number;
	uploaded_at: string;
	updated_at: string;
}

export interface MustaqbilCredentialRequest {
	email: string;
	mustaqbil_email: string;
	mustaqbil_password: string;
}

export interface MustaqbilCredentialResponse {
	email: string;
	mustaqbil_email: string;
	mustaqbil_password: string;
	created_at: string;
	updated_at: string;
}

export interface CVRecommendationJob {
	title: string;
	company_name: string;
	location: string;
	salary: string | null;
	job_type: string;
	experience: string;
	education: string;
	posted_date: string;
	apply_before: string;
	job_description: string | null;
	skills: string;
	job_link: string;
}

export interface CVRecommendationResponse {
	response: {
		message: string;
		jobs: CVRecommendationJob[];
	};
	status: number;
	cv_path: string;
	generated_query: string;
}

export function startApplyRun(payload: ApplyRunRequest) {
	return jsonFetch<ApplyRunCreateResponse>(`${BASE_URL}${API_ENDPOINTS.APPLY.RUN}`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function applyPlatformJob(payload: PlatformApplyRequest) {
	return jsonFetch<PlatformApplyResponse>(`${BASE_URL}/apply/platform`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function getApplyRunStatus(runId: number) {
	return jsonFetch<ApplyRunStatusResponse>(`${BASE_URL}${API_ENDPOINTS.APPLY.RUN_STATUS}/${runId}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

export function getAppliedJobs(
	email: string,
	params?: { status?: string; site?: string; limit?: number; offset?: number }
) {
	const search = new URLSearchParams();
	if (params?.status) search.set('status', params.status);
	if (params?.site) search.set('site', params.site);
	if (typeof params?.limit === 'number') search.set('limit', String(params.limit));
	if (typeof params?.offset === 'number') search.set('offset', String(params.offset));
	const qs = search.toString() ? `?${search.toString()}` : '';
	return jsonFetch<AppliedJobListResponse>(`${BASE_URL}${API_ENDPOINTS.APPLY.APPLIED_JOBS}/${encodeURIComponent(email)}${qs}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

export async function uploadResume(email: string, file: File) {
	const form = new FormData();
	form.append('email', email);
	form.append('file', file);
	const res = await fetch(`${BASE_URL}${API_ENDPOINTS.APPLY.RESUME_UPLOAD}`, {
		method: 'POST',
		body: form,
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(parseApiError(text, res.status));
	}
	return (await res.json()) as ResumeUploadResponse;
}

export function getResumeMetadata(email: string) {
	return jsonFetch<ResumeMetadataResponse>(`${BASE_URL}${API_ENDPOINTS.APPLY.RESUME_METADATA}/${encodeURIComponent(email)}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

export function getResumeDownloadUrl(email: string) {
	return `${BASE_URL}${API_ENDPOINTS.APPLY.RESUME_METADATA}/${encodeURIComponent(email)}/download`;
}

export async function uploadProfilePicture(email: string, file: File) {
	const form = new FormData();
	form.append('email', email);
	form.append('file', file);
	const res = await fetch(`${BASE_URL}${API_ENDPOINTS.APPLY.PROFILE_PICTURE_UPLOAD}`, {
		method: 'POST',
		body: form,
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(parseApiError(text, res.status));
	}
	return (await res.json()) as ProfilePictureUploadResponse;
}

export function getProfilePictureMetadata(email: string) {
	return jsonFetch<ProfilePictureMetadataResponse>(
		`${BASE_URL}${API_ENDPOINTS.APPLY.PROFILE_PICTURE_METADATA}/${encodeURIComponent(email)}`,
		{
			method: 'GET',
			cache: 'no-store',
		}
	);
}

export function getProfilePictureDownloadUrl(email: string) {
	return `${BASE_URL}${API_ENDPOINTS.APPLY.PROFILE_PICTURE_METADATA}/${encodeURIComponent(email)}/download`;
}

export function saveMustaqbilCredentials(payload: MustaqbilCredentialRequest) {
	return jsonFetch<MustaqbilCredentialResponse>(`${BASE_URL}${API_ENDPOINTS.APPLY.MUSTAQBIL_CREDENTIALS}`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function getMustaqbilCredentials(email: string) {
	return jsonFetch<MustaqbilCredentialResponse>(
		`${BASE_URL}${API_ENDPOINTS.APPLY.MUSTAQBIL_CREDENTIALS}/${encodeURIComponent(email)}`,
		{
			method: 'GET',
			cache: 'no-store',
		}
	);
}

export function getCVRecommendations() {
	return jsonFetch<CVRecommendationResponse>(
		`${CHAT_BASE_URL}${API_ENDPOINTS.RECOMMENDATIONS.CV_RECOMMENDATIONS}`,
		{
			method: 'POST',
			cache: 'no-store',
		}
	);
}

