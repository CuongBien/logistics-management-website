/**
 * Gọi BFF Ordering/Warehouse.
 * - Ưu tiên NEXT_PUBLIC_API_GATEWAY (browser → gateway trực tiếp, tránh proxy dev của Next và lỗi chập chờn ::1).
 * - Nếu không set: same-origin `/bff/*` nhờ rewrite trong next.config.ts.
 */

function gatewayOrigin(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_API_GATEWAY?.trim();
  if (raw) return raw.replace(/\/$/, "");
}

function apiBase(service: "oms" | "wms"): string {
  const origin = gatewayOrigin();
  if (origin) {
    const path = service === "wms" ? "/api/warehouse" : "/api/ordering";
    return `${origin}${path}`;
  }
  return service === "wms" ? "/bff/wms" : "/bff/oms";
}

/** Một nguồn sự thật cho key localStorage (đồng bộ với trang Cài đặt). */
export const LMS_ACCESS_TOKEN_KEY = "lms_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LMS_ACCESS_TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { service?: "oms" | "wms" }
): Promise<T> {
  const service = init?.service ?? "oms";
  const base = apiBase(service);
  const { service: _s, ...rest } = init ?? {};
  const token = getAccessToken();
  const headers = new Headers(rest.headers);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${base}${path}`, { ...rest, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : text || res.statusText;
    throw new Error(`${res.status} ${msg}`);
  }

  return data as T;
}
