import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    if (url.startsWith('/') || url.startsWith('http') || url.startsWith('https')) {
      // Basic check for common URL patterns without crashing
      new URL(url.startsWith('/') ? `http://localhost${url}` : url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function normalizeSocialUrl(
  value: string | null | undefined,
  platform: 'instagram' | 'tiktok' | 'facebook' | 'twitter'
): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '#') {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const handle = trimmed.replace(/^@/, '').replace(/^\/+/, '');

  if (platform === 'instagram') {
    return `https://www.instagram.com/${handle}`;
  }

  if (platform === 'tiktok') {
    return `https://www.tiktok.com/@${handle}`;
  }

  if (platform === 'twitter') {
    if (trimmed.includes('.')) {
      return `https://${trimmed}`;
    }
    return `https://x.com/${handle}`;
  }

  if (platform === 'facebook') {
    if (trimmed.includes('.')) {
      return `https://${trimmed}`;
    }
    return `https://www.facebook.com/${handle}`;
  }

  return null;
}
