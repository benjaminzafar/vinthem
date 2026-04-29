const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__');

interface CloudflareRuntimeContext {
  env: CloudflareEnv;
}

function readCloudflareContextFromGlobal(): CloudflareRuntimeContext | null {
  const globalScope = globalThis as typeof globalThis & {
    [CLOUDFLARE_CONTEXT_SYMBOL]?: CloudflareRuntimeContext;
  };

  return globalScope[CLOUDFLARE_CONTEXT_SYMBOL] ?? null;
}

export function getCloudflareRuntimeContext(): CloudflareRuntimeContext {
  const context = readCloudflareContextFromGlobal();

  if (!context) {
    throw new Error('Cloudflare runtime context is unavailable.');
  }

  return context;
}

export function getCloudflareEnv(): CloudflareEnv {
  return getCloudflareRuntimeContext().env;
}
