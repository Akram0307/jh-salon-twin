const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

function buildUrl(path: string): string {
  return `${API_BASE}${path}`;
}

type ApiFetchError = Error & {
  status?: number;
  data?: unknown;
  contentType?: string;
};

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
  let parsed: unknown = null;

  if (rawText) {
    if (contentType.includes('application/json')) {
      parsed = JSON.parse(rawText);
    } else {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = rawText;
      }
    }
  }

  if (!response.ok) {
    const message = typeof parsed === 'object' && parsed !== null
      ? ((parsed as { message?: string; error?: string }).message || (parsed as { message?: string; error?: string }).error)
      : undefined;
    const error: ApiFetchError = new Error(message || rawText || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = parsed;
    error.contentType = contentType;
    throw error;
  }

  if (!rawText) {
    return null as T;
  }

  if (typeof parsed === 'string') {
    throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}`);
  }

  return parsed as T;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    method: 'GET',
    ...init,
  });
}
