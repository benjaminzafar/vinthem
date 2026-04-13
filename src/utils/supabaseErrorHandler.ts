// Supabase error handler — replaced legacy error handler utility
import { createClient } from '@/utils/supabase/client';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
  };
}

export async function handleSupabaseError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error 
      ? error.message 
      : (typeof error === 'object' && error !== null 
          ? JSON.stringify(error) 
          : String(error)),
    authInfo: {
      userId: user?.id,
      email: user?.email ?? null,
    },
    operationType,
    path,
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Keep backward-compatible export name
export const handleFirestoreError = handleSupabaseError;
