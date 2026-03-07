const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

function buildUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(rawText || `Request failed with status ${response.status}`);
  }

  if (!rawText) {
    return null as T;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(rawText) as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}`);
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    method: 'GET',
    ...init,
  });
}
