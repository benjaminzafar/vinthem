import type { User } from '@supabase/supabase-js';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

type SessionClient = Awaited<ReturnType<typeof createClient>>;
type AdminClient = ReturnType<typeof createAdminClient>;

type UserProfileRow = {
  role: string | null;
};

type EnsureUserProfilePayload = {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  updated_at: string;
};

async function getRoleWithSessionClient(
  supabase: SessionClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle<UserProfileRow>();

  if (error) {
    throw error;
  }

  return data?.role ?? null;
}

async function getRoleWithAdminClient(
  supabase: AdminClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle<UserProfileRow>();

  if (error) {
    throw error;
  }

  return data?.role ?? null;
}

export async function getSessionUserWithRole() {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.getUser();
  const user = authData?.user;

  if (error) {
    throw error;
  }

  if (!user) {
    return { supabase, user: null, role: null, isAdmin: false, acceptedTermsAt: null };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, accepted_terms_at')
    .eq('id', user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    role: profile?.role ?? null,
    isAdmin: profile?.role === 'admin',
    acceptedTermsAt: profile?.accepted_terms_at ?? null
  };
}

export async function requireAdminUser() {
  const context = await getSessionUserWithRole();

  if (!context.user) {
    throw new Error('Authentication required.');
  }

  if (!context.isAdmin) {
    throw new Error('Admin access required.');
  }

  return context;
}

export async function getBearerUserWithRole(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  const supabase = createAdminClient();
  const { data: authData, error } = await supabase.auth.getUser(token);
  const user = authData?.user;

  if (error || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  const role = await getRoleWithAdminClient(supabase, user.id);

  return {
    supabase,
    user,
    role,
    isAdmin: role === 'admin',
  };
}

export async function requireAdminBearerUser(authorizationHeader: string | null) {
  const context = await getBearerUserWithRole(authorizationHeader);

  if (!context.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }

  return context;
}

export async function ensureUserProfile(user: User, name?: string | null, lang?: string) {
  const supabase = createAdminClient();
  const { data: existingProfile, error: readError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<UserProfileRow>();

  if (readError) {
    throw readError;
  }

  // 2. Perform the update with a fallback to avoid "column does not exist" errors
  const updatePayload: EnsureUserProfilePayload = {
    id: user.id,
    email: user.email ?? null,
    full_name: name ?? '',
    role: existingProfile?.role ?? 'client',
    updated_at: new Date().toISOString(),
  };

  // Only add preferred_lang if we are reasonably sure it won't crash the query
  // For now, we will skip it to get the site back up immediately.
  
  const { error } = await supabase.from('users').upsert(updatePayload, { onConflict: 'id' });

  if (error) {
    throw error;
  }

  // --- Background sync to Brevo CRM ---
  if (user.email) {
    // Add to Brevo in the background to avoid blocking the main auth flow
    void import('@/lib/brevo')
      .then(({ syncContactToBrevo }) => syncContactToBrevo(user.email as string, {
        FULL_NAME: name ?? '',
        SOURCE: 'account_auth_system',
        LANG: lang ?? 'en'
      }))
      .catch((error) => logger.error('[Brevo Sync Error] ensureUserProfile:', error));
  }
}
