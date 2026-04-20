'use server';
﻿import { logger } from '@/lib/logger';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/admin';
import { sanitizeLocalizedString, slugify } from '@/lib/admin-content';

type StaticPageInput = {
  id?: string;
  title: Record<string, string>;
  slug: string;
  content: Record<string, string>;
  languages: string[];
};

type PageActionResult = {
  success: boolean;
  message: string;
  id?: string;
  error?: string;
};

export async function savePageAction(input: StaticPageInput): Promise<PageActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const sanitizedTitle = sanitizeLocalizedString(input.title, input.languages);
    const sanitizedContent = sanitizeLocalizedString(input.content, input.languages);
    const slug = slugify(input.slug || sanitizedTitle.en);

    if (!sanitizedTitle.en) {
      throw new Error('English title is required.');
    }

    if (!sanitizedContent.en) {
      throw new Error('English content is required.');
    }

    if (!slug) {
      throw new Error('Slug is required.');
    }

    const payload = {
      title: sanitizedTitle,
      slug,
      content: sanitizedContent,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { error } = await supabase.from('pages').update(payload).eq('id', input.id);
      if (error) {
        throw error;
      }

      revalidatePath(`/p/${slug}`);
      revalidatePath('/admin/pages');
      return { success: true, message: 'Page updated.', id: input.id };
    }

    const { data, error } = await supabase
      .from('pages')
      .insert(payload)
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw error ?? new Error('Failed to create page.');
    }

    revalidatePath(`/p/${slug}`);
    revalidatePath('/admin/pages');
    return { success: true, message: 'Page created.', id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save page.';
    logger.error('[Action Error] savePageAction:', error);
    return { success: false, message, error: message };
  }
}

export async function deletePagesAction(ids: string[]): Promise<PageActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const cleanIds = ids.filter(Boolean);

    if (cleanIds.length === 0) {
      throw new Error('No pages selected.');
    }

    const { error } = await supabase.from('pages').delete().in('id', cleanIds);
    if (error) {
      throw error;
    }

    revalidatePath('/admin/pages');
    return { success: true, message: 'Pages deleted.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete pages.';
    logger.error('[Action Error] deletePagesAction:', error);
    return { success: false, message, error: message };
  }
}

export async function seedPagesAction(): Promise<PageActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const now = new Date().toISOString();
    const defaultPages = [
      { title: { en: 'Support' }, slug: 'support', content: { en: '# Support\n\nHow can we help you today?' } },
      { title: { en: 'FAQ' }, slug: 'faq', content: { en: '# Frequently Asked Questions\n\nFind answers to common questions here.' } },
      { title: { en: 'Shipping & Returns' }, slug: 'shipping-returns', content: { en: '# Shipping & Returns\n\nOur policies on shipping and returns.' } },
      { title: { en: 'Contact Us' }, slug: 'contact', content: { en: '# Contact Us\n\nGet in touch with our team.' } },
      { title: { en: 'Privacy Policy' }, slug: 'privacy-policy', content: { en: '# Privacy Policy\n\nYour privacy is important to us.' } },
    ];

    for (const page of defaultPages) {
      const { data: existing, error: readError } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', page.slug)
        .maybeSingle<{ id: string }>();

      if (readError) {
        throw readError;
      }

      if (!existing) {
        const { error } = await supabase.from('pages').insert({ ...page, updated_at: now });
        if (error) {
          throw error;
        }
      }
    }

    revalidatePath('/admin/pages');
    return { success: true, message: 'Default pages seeded.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to seed pages.';
    logger.error('[Action Error] seedPagesAction:', error);
    return { success: false, message, error: message };
  }
}

