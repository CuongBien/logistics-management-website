import { getSession } from 'next-auth/react';

// Real backend URLs (used only for display in Settings page)
const OMS_BACKEND_URL = process.env.NEXT_PUBLIC_OMS_URL || 'http://127.0.0.1:5000';
const WMS_BACKEND_URL = process.env.NEXT_PUBLIC_WMS_URL || 'http://127.0.0.1:5051';

// Proxy paths — all requests go through Next.js rewrites to avoid CORS
const OMS_PROXY = '/api/oms';
const WMS_PROXY = '/api/wms';
const MASTERDATA_PROXY = '/api/masterdata';

export type ServiceTarget = 'oms' | 'wms' | 'masterdata';

function getBaseUrl(service: ServiceTarget): string {
  if (service === 'oms') return OMS_PROXY;
  if (service === 'wms') return WMS_PROXY;
  return MASTERDATA_PROXY;
}

async function getToken(): Promise<string | null> {
  const session = await getSession();
  return (session as any)?.accessToken || null;
}

export async function getStoredToken(): Promise<string | null> {
  return getToken();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  correlationId?: string;
}

export async function fetchApi<T = unknown>(
  service: ServiceTarget,
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const baseUrl = getBaseUrl(service);
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = await getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn("fetchApi: NO TOKEN FOUND IN SESSION!", await getSession());
  }

  if (options.correlationId) {
    headers['X-Correlation-Id'] = options.correlationId;
  }

  const { body, correlationId, ...restOptions } = options;

  const response = await fetch(url, {
    ...restOptions,
    headers,
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorBody: unknown;
    const text = await response.text();
    try {
      errorBody = text ? JSON.parse(text) : undefined;
    } catch {
      errorBody = text;
    }
    console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
    throw new ApiError(response.status, response.statusText, errorBody);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

// Health check helpers — routed through Next.js proxy
export async function checkHealth(service: ServiceTarget): Promise<boolean> {
  try {
    const path = service === 'oms' ? '/health/oms' : '/health/wms';
    const res = await fetch(path, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

// URL config helpers (display only — actual calls go through proxy)
export function getOmsUrl(): string {
  return OMS_BACKEND_URL;
}

export function getWmsUrl(): string {
  return WMS_BACKEND_URL;
}
