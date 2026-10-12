/**
 * Client-Side API Error.
 * Thrown when internal Next.js API or BFF route returns a non-2xx status code.
 */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function executeSilentRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { Accept: 'application/json' },
        });
        return refreshRes.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export interface ApiFetchOptions extends RequestInit {
  _retry?: boolean;
}

/**
 * Standard typed client fetcher for browser/client components.
 * Automatically injects headers, parses JSON, handles transparent 401 silent refresh,
 * and transforms HTTP errors into typed ApiClientError.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { _retry, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (fetchOptions.body && typeof fetchOptions.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...fetchOptions,
    headers,
  });

  const isAuthBypassEndpoint =
    endpoint.startsWith('/api/auth/login') ||
    endpoint.startsWith('/api/auth/refresh') ||
    endpoint.startsWith('/api/auth/logout');

  if (response.status === 401 && !_retry && !isAuthBypassEndpoint) {
    const refreshed = await executeSilentRefresh();
    if (refreshed) {
      return apiFetch<T>(endpoint, {
        ...options,
        _retry: true,
      });
    }
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorCode = typeof data === 'object' && data?.code ? String(data.code) : `HTTP_${response.status}`;
    const errorMessage =
      typeof data === 'object' && (data?.error || data?.message)
        ? String(data.error || data.message)
        : response.statusText || 'Request failed';
    const details = typeof data === 'object' && 'details' in data ? data.details : undefined;

    throw new ApiClientError(response.status, errorCode, errorMessage, details);
  }

  return data as T;
}

/**
 * Convenience helper to fetch and unwrap standard ApiResponse<T>.data envelope.
 */
export async function apiFetchData<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch<{ data: T }>(endpoint, options);
  return response.data;
}
