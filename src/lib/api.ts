import { ApiResponse, AppSettings, ShortLink } from '../types.ts';

export async function fetchLinks(search?: string): Promise<ApiResponse<{ links: ShortLink[] }>> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`/api/links${query}`);
  return res.json();
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
  return res.json();
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
  return res.json();
}

export async function deleteLink(alias: string): Promise<ApiResponse> {
  const res = await fetch(`/api/links/${encodeURIComponent(alias)}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function getLinkByAlias(alias: string): Promise<ApiResponse> {
  const res = await fetch(`/api/links/${encodeURIComponent(alias)}`);
  return res.json();
}

export async function trackClick(alias: string): Promise<ApiResponse> {
  const res = await fetch(`/api/links/click/${encodeURIComponent(alias)}`, {
    method: 'POST',
  });
  return res.json();
}

export async function verifyAdminPin(pin: string): Promise<ApiResponse> {
  const res = await fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return res.json();
}

export async function changeAdminPin(oldPin: string, newPin: string): Promise<ApiResponse> {
  const res = await fetch('/api/auth/change-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPin, newPin }),
  });
  return res.json();
}

export async function getSettings(): Promise<ApiResponse> {
  const res = await fetch('/api/settings');
  return res.json();
}

export async function saveSettings(settings: Partial<AppSettings & { adminPin?: string }>): Promise<ApiResponse> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}
