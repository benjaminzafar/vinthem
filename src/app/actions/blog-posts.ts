'use server';
﻿import { logger } from '@/lib/logger';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/admin';
import { sanitizeLocalizedString } from '@/lib/admin-content';

type BlogPostInput = {
  id?: string;
  title: Record<string, string>;
  excerpt: Record<string, string>;
  content: Record<string, string>;
  imageUrl: string;
  author: string;
  languages: string[];
};

type BlogActionResult = {
  success: boolean;
  message: string;
  id?: string;
  error?: string;
};

export async function saveBlogPostAction(input: BlogPostInput): Promise<BlogActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const sanitizedTitle = sanitizeLocalizedString(input.title, input.languages);
    const sanitizedExcerpt = sanitizeLocalizedString(input.excerpt, input.languages);
    const sanitizedContent = sanitizeLocalizedString(input.content, input.languages);
    const author = input.author.replace(/[<>]/g, '').trim();
    const imageUrl = input.imageUrl.replace(/[<>]/g, '').trim();

    if (!sanitizedTitle.en) {
      throw new Error('English title is required.');
    }

    if (!sanitizedContent.en) {
      throw new Error('English content is required.');
    }

    if (!author) {
      throw new Error('Author is required.');
    }

    const payload = {
      title: sanitizedTitle,
      excerpt: sanitizedExcerpt,
      content: sanitizedContent,
      image_url: imageUrl,
      author,
    };

    if (input.id) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', input.id);
      if (error) {
        throw error;
      }

      revalidatePath(`/blog/${input.id}`);
      revalidatePath('/admin/blogs');
      revalidatePath('/blog');
      return { success: true, message: 'Post updated.', id: input.id };
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      throw error ?? new Error('Failed to create blog post.');
    }

    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${data.id}`);
    return { success: true, message: 'Post created.', id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save blog post.';
    logger.error('[Action Error] saveBlogPostAction:', error);
    return { success: false, message, error: message };
  }
}

export async function deleteBlogPostsAction(ids: string[]): Promise<BlogActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const cleanIds = ids.filter(Boolean);
    if (cleanIds.length === 0) {
      throw new Error('No posts selected.');
    }

    const { error } = await supabase.from('blog_posts').delete().in('id', cleanIds);
    if (error) {
      throw error;
    }

    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    return { success: true, message: 'Posts deleted.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete posts.';
    logger.error('[Action Error] deleteBlogPostsAction:', error);
    return { success: false, message, error: message };
  }
}

