export type AIRequestError = Error & { status?: number };

const PROVIDER_BUSY_PATTERNS = [
  'overloaded',
  'overload',
  'temporarily busy',
  'temporarily unavailable',
  'rate limit',
  'too many requests',
  'capacity',
  'service unavailable',
  'try again in 1-2 minutes',
  'please try again in 1-2 minutes',
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || '';
  }

  if (typeof error === 'string') {
    return error;
  }

  return '';
}

export function isTransientAIError(error: unknown): error is AIRequestError {
  if (!(error instanceof Error)) {
    return false;
  }

  const status = typeof (error as AIRequestError).status === 'number'
    ? (error as AIRequestError).status
    : null;

  if (status === 429) {
    return true;
  }

  if (status !== 500 && status !== 503) {
    return false;
  }

  const message = getErrorMessage(error).toLowerCase();
  return PROVIDER_BUSY_PATTERNS.some((pattern) => message.includes(pattern));
}

export function getAIErrorMessage(error: unknown, fallback: string): string {
  const err = error as AIRequestError;

  if (err?.status === 401 || err?.status === 403) {
    return 'Groq API key is missing or invalid in Integrations.';
  }

  if (err?.status === 429) {
    return 'AI is temporarily busy. Please wait a few seconds and try again.';
  }

  if ((err?.status === 500 || err?.status === 503) && isTransientAIError(error)) {
    return 'AI service is temporarily overloaded. Please retry in 1-2 minutes.';
  }

  const message = getErrorMessage(error).trim();
  return message || fallback;
}
