export type UserRoleApi = 'Job_Seeker' | 'Admin';

const BASE_URL = 'https://hmmpwkwg-8000.asse.devtunnels.ms';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) },
    signal: controller.signal,
    ...options,
    cache: 'no-store',
  }).catch((e) => {
    clearTimeout(timeout);
    throw new Error('Network error. Please check your internet or server status.');
  });
  clearTimeout(timeout);
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    let message: string = '';
    if (typeof payload === 'string') {
      // Try to extract a message from a JSON-looking string
      try {
        const parsed = JSON.parse(payload);
        message = parsed.detail || parsed.message || parsed.error || payload;
      } catch {
        message = payload;
      }
    } else {
      message = payload.detail || payload.message || payload.error || 'Request failed';
    }
    throw new Error(message);
  }
  return payload as T;
}

export function registerUser(data: { fullname: string; email: string; password: string; role: UserRoleApi }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginUser(data: { email: string; password: string; role: UserRoleApi }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getJobs() {
  return request('/CRUD/Get_jobs');
}

export function getJobsByCity(city: 'Lahore' | 'Karachi' | 'Islamabad' | 'Rawalpindi') {
  return request(`/CRUD/get_jobs_by_city?city=${encodeURIComponent(city)}`);
}

export function startScraper() {
  return request('/Scraper/start_scraper', { method: 'GET' });
}


