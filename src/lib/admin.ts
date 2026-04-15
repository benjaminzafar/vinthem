import type { User } from '@supabase/supabase-js';
import { createAdminClient, createClient } from '@/utils/supabase/server';

type SessionClient = Awaited<ReturnType<typeof createClient>>;
type AdminClient = ReturnType<typeof createAdminClient>;

type UserProfileRow = {
  role: string | null;
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    return { supabase, user: null, role: null, isAdmin: false };
  }

  const role = await getRoleWithSessionClient(supabase, user.id);

  return {
    supabase,
    user,
    role,
    isAdmin: role === 'admin',
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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

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

export async function ensureUserProfile(user: User, name?: string | null) {
  const supabase = createAdminClient();
  const { data: existingProfile, error: readError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<UserProfileRow>();

  if (readError) {
    throw readError;
  }

  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      name: name ?? '',
      role: existingProfile?.role ?? 'client',
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw error;
  }
}
