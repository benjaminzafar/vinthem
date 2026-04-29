export function extractMediaKey(source: string | null | undefined): string | null {
  if (!source) {
    return null;
  }

  if (source.startsWith('/api/media?key=')) {
    const key = source.split('/api/media?key=')[1];
    return key ? decodeURIComponent(key) : null;
  }

  try {
    const parsed = source.startsWith('http') ? new URL(source) : new URL(source, 'http://localhost');
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
