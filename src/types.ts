export interface ShortLink {
  id: string;
  alias: string;
  destinationUrl: string;
  clickCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastClickedAt?: string;
  notes?: string;
}

export interface AppSettings {
  displayDomain: string;
  redirectMode: 'direct' | 'interstitial';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  link?: ShortLink;
  links?: ShortLink[];
  count?: number;
  settings?: AppSettings;
  destinationUrl?: string;
  clickCount?: number;
}
