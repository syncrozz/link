import { ApiResponse, AppSettings, ShortLink } from '../types.ts';

async function safeJson<T = any>(res: Response): Promise<ApiResponse<T>> {
  try {
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: `Ralat pelayan (${res.status}): ${err?.message || 'Gagal memproses data'}`,
    };
  }
}

export async function fetchLinks(search?: string): Promise<ApiResponse<{ links: ShortLink[] }>> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`/api/links${query}`);
  return safeJson<{ links: ShortLink[] }>(res);
}

export async function createLink(data: {
  alias: string;
  destinationUrl: string;
  status?: 'active' | 'inactive';
  notes?: string;
}): Promise<ApiResponse> {
  const res = await fetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return safeJson(res);
}

export async function updateLink(
  alias: string,
  data: {
    newAlias?: string;
    destinationUrl?: string;
    status?: 'active' | 'inactive';
    notes?: string;
  }
): Promise<ApiResponse> {
  const res = await fetch(`/api/links/${encodeURIComponent(alias)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return safeJson(res);
}

export async function deleteLink(alias: string): Promise<ApiResponse> {
  const res = await fetch(`/api/links/${encodeURIComponent(alias)}`, {
    method: 'DELETE',
  });
  return safeJson(res);
}

export async function getLinkByAlias(alias: string): Promise<ApiResponse> {
  const res = await fetch(`/api/links/${encodeURIComponent(alias)}`);
  return safeJson(res);
}

export async function trackClick(alias: string): Promise<ApiResponse> {
  const res = await fetch(`/api/links/click/${encodeURIComponent(alias)}`, {
    method: 'POST',
  });
  return safeJson(res);
}

export async function verifyAdminPin(pin: string): Promise<ApiResponse> {
  const res = await fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return safeJson(res);
}

export async function changeAdminPin(oldPin: string, newPin: string): Promise<ApiResponse> {
  const res = await fetch('/api/auth/change-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPin, newPin }),
  });
  return safeJson(res);
}

export async function getSettings(): Promise<ApiResponse> {
  const res = await fetch('/api/settings');
  return safeJson(res);
}

export async function saveSettings(settings: Partial<AppSettings & { adminPin?: string }>): Promise<ApiResponse> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return safeJson(res);
}
