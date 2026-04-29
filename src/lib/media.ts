export function extractMediaKey(source: string | null | undefined): string | null {
  if (!source) {
    return null;
  }

  const trimmed = source.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/api/media?key=')) {
    const key = trimmed.split('/api/media?key=')[1];
    return key ? decodeURIComponent(key) : null;
  }

  if (!trimmed.startsWith('/') && !/^(https?:|mailto:|tel:|#)/i.test(trimmed)) {
    return decodeURIComponent(trimmed.replace(/^\/+/, ''));
  }

  try {
    const parsed = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, 'http://localhost');
    const pathname = parsed.pathname.replace(/^\/+/, '');

    if (!pathname) {
      return null;
    }

    if (parsed.hostname === 'cdn.vinthem.com' || parsed.hostname.endsWith('.r2.dev')) {
      return decodeURIComponent(pathname);
    }

    if (parsed.hostname.endsWith('.r2.cloudflarestorage.com')) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        return decodeURIComponent(segments.slice(1).join('/'));
      }
      return decodeURIComponent(pathname);
    }
  } catch {
    return null;
  }

  return null;
}

export function toMediaProxyUrl(source: string | null | undefined): string {
  if (!source) {
    return '';
  }

  if (source.startsWith('/api/media?key=')) {
    return source;
  }

  const key = extractMediaKey(source);
  if (!key) {
    return source;
  }

  return `/api/media?key=${encodeURIComponent(key)}`;
}
