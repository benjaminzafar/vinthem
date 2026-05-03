'use server';
﻿import { logger } from '@/lib/logger';

import { revalidatePath } from 'next/cache';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { requireAdminUser } from '@/lib/admin';
import { extractMediaKey } from '@/lib/media';

/**
 * SECURITY NOTE:
 * We use a hybrid approach. createClient() is used for reads to respect RLS
 * where appropriate, but administrative writes use createAdminClient() to
 * bypass RLS blocks. requireAdminUser() ensures all actions are authorized.
 */

type CategoryTranslation = {
  name: string;
  description?: string;
};

export type SaveCategoryInput = {
  id?: string;
  name: string;
  slug?: string;
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

export type DeleteCategoriesInput = {
  categoryIds: string[];
};

export type CategoryActionResponse = {
  success: boolean;
  message: string;
  error?: string;
};

async function collectDescendantCategoryIds(supabase: ReturnType<typeof createAdminClient>, seedIds: string[]) {
  const discovered = new Set(seedIds);
  const queue = [...seedIds];

  while (queue.length > 0) {
    const parentId = queue.shift();
    if (!parentId) {
      continue;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', parentId);

    if (error) {
      throw error;
    }

    for (const child of data || []) {
      if (!discovered.has(child.id)) {
        discovered.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return [...discovered];
}

export async function bulkImportCategoriesAction(categories: any[]): Promise<CategoryActionResponse> {
  try {
    await requireAdminUser();
    const supabase = createAdminClient();

    if (!categories || categories.length === 0) {
      throw new Error('No collections provided for import.');
    }

    // Clean and validate data before insertion
    const cleanedCategories = categories.map((c: any) => ({
      name: c.name?.trim() || 'Untitled Collection',
      slug: c.slug?.trim() || (c.name ? c.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : `col-${Date.now()}`),
      description: c.description?.trim() || null,
      is_featured: c.is_featured === 'true' || c.isFeatured === true || false,
      show_in_hero: c.show_in_hero === 'true' || c.showInHero === true || false,
      parent_id: c.parent_id || c.parentId || null,
      image_url: c.image_url || c.imageUrl || null,
      icon_url: c.icon_url || c.iconUrl || null,
      translations: c.translations ? (typeof c.translations === 'string' ? JSON.parse(c.translations) : c.translations) : {},
    }));

    // Perform bulk upsert based on slug
    const { error } = await supabase
      .from('categories')
      .upsert(cleanedCategories, { onConflict: 'slug' });

    if (error) {
      throw error;
    }

    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/products');

    return {
      success: true,
      message: `Successfully imported ${cleanedCategories.length} collections.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import collections.';
    logger.error('[Action Error] bulkImportCategoriesAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

async function requireAdmin() {
  await requireAdminUser();
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

function normalizeCategoryMediaValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return extractMediaKey(value) || value.trim() || null;
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
    const baseSlug = input.slug || slugifyCategoryName(input.name);
    const slug = await ensureUniqueSlug(baseSlug, input.id);
    const supabase = createAdminClient();


    const payload = {
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      is_featured: input.isFeatured,
      show_in_hero: input.showInHero,
      parent_id: input.parentId || null,
      image_url: normalizeCategoryMediaValue(input.imageUrl),
      icon_url: normalizeCategoryMediaValue(input.iconUrl),
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
    revalidatePath('/products');

    return {
      success: true,
      message: input.id ? 'Collection updated successfully.' : 'Collection created successfully.',
    };
  } catch (error: unknown) {
    logger.error('[saveCategoryAction] Critical Error:', error);
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for common missing column error
    if (errorMessage.includes('column') || errorMessage.includes('does not exist')) {
      errorMessage = 'DATABASE ERROR: A required column is missing. Please check your schema.';
    }

    return {
      success: false,
      message: 'Failed to save collection.',
      error: errorMessage,
    };
  }
}

export async function deleteCategoryAction(input: DeleteCategoryInput): Promise<CategoryActionResponse> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();


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
    revalidatePath('/products');

    return {
      success: true,
      message: 'Collection deleted successfully.',
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: 'Failed to delete collection.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteCategoriesAction(input: DeleteCategoriesInput): Promise<CategoryActionResponse> {
  try {
    await requireAdmin();

    const categoryIds = input.categoryIds
      .map((id) => id.trim())
      .filter(Boolean);

    if (categoryIds.length === 0) {
      throw new Error('Select at least one collection to delete.');
    }

    const supabase = createAdminClient();

    const allIdsToDelete = await collectDescendantCategoryIds(supabase, categoryIds);

    // 2. Unlink products (safety measure even with set null constraints)
    // We set category_id to null for any products in these categories
    await supabase
      .from('products')
      .update({ category_id: null })
      .in('category_id', allIdsToDelete);

    // 3. Perform the deletion
    const { error } = await supabase
      .from('categories')
      .delete()
      .in('id', allIdsToDelete);

    if (error) {
      throw error;
    }

    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath('/products');

    return {
      success: true,
      message: allIdsToDelete.length > 1 
        ? `Successfully removed ${allIdsToDelete.length} collections.` 
        : 'Collection removed successfully.',
    };
  } catch (error: unknown) {
    logger.error('[deleteCategoriesAction] Error:', error);
    return {
      success: false,
      message: 'Failed to delete collections.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}



