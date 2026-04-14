'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

/**
 * SECURITY NOTE:
 * We strictly use createClient() (which uses the user's session cookies) instead of createAdminClient().
 * This ensures that RLS (Row Level Security) is respected and that we don't accidentally
 * perform actions on behalf of the service role without a valid user session.
 * 
 * SUPABASE_SERVICE_ROLE_KEY is NOT required for this file.
 */

const ADMIN_EMAILS = new Set([
  'benjaminzafar10@gmail.com',
  'benjaminzafar7@gmail.com',
]);

type CategoryTranslation = {
  name: string;
  description?: string;
};

export type SaveCategoryInput = {
  id?: string;
  name: string;
  description?: string;
  isFeatured: boolean;
  showInHero: boolean;
  parentId?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  translations?: Record<string, CategoryTranslation>;
};

export type DeleteCategoryInput = {
  categoryId: string;
  action: 'reassign' | 'delete';
  reassignTo?: string;
  productIds: string[];
  directProductIds: string[];
  parentProductIds: string[];
};

export type CategoryActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.has(user.email ?? '');
  if (!isAdmin) {
    throw new Error('Admin access required.');
  }
}

function slugifyCategoryName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'collection'
  );
}

async function ensureUniqueSlug(baseSlug: string, currentId?: string) {
  const supabase = await createClient();
  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!data || data.id === currentId) {
      return candidate;
    }
  }

  throw new Error('Could not generate a unique collection slug.');
}

export async function saveCategoryAction(input: SaveCategoryInput): Promise<CategoryActionResponse> {
  try {
    await requireAdmin();
    const baseSlug = slugifyCategoryName(input.name);
    const slug = await ensureUniqueSlug(baseSlug, input.id);
    const supabase = await createClient();

    const payload = {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      is_featured: input.isFeatured,
      show_in_hero: input.showInHero,
      parent_id: input.parentId || null,
      image_url: input.imageUrl || null,
      icon_url: input.iconUrl || null,
      translations: input.translations || {},
    };

    if (input.id) {
      const { error } = await supabase.from('categories').update(payload).eq('id', input.id);
      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) {
        throw error;
      }
    }

    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: input.id ? 'Collection updated successfully.' : 'Collection created successfully.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to save collection.',
      error: error?.message || 'Unknown error',
    };
  }
}

export async function deleteCategoryAction(input: DeleteCategoryInput): Promise<CategoryActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    if (input.action === 'delete' && input.productIds.length > 0) {
      const { error } = await supabase.from('products').delete().in('id', input.productIds);
      if (error) {
        throw error;
      }
    }

    if (input.action === 'reassign') {
      if (!input.reassignTo) {
        throw new Error('Select a target collection for reassignment.');
      }

      if (input.directProductIds.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ category_id: input.reassignTo })
          .in('id', input.directProductIds);
        if (error) {
          throw error;
        }
      }

      if (input.parentProductIds.length > 0) {
        const { error } = await supabase
          .from('products')
          .update({ parent_category_id: input.reassignTo })
          .in('id', input.parentProductIds);
        if (error) {
          throw error;
        }
      }
    }

    const { error: categoryError } = await supabase.from('categories').delete().eq('id', input.categoryId);
    if (categoryError) {
      throw categoryError;
    }

    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Collection deleted successfully.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to delete collection.',
      error: error?.message || 'Unknown error',
    };
  }
}
