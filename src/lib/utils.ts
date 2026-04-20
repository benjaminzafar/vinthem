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
