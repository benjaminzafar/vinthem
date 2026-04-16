import { BlogPost, StaticPage } from '@/types';
import { LocalizedString } from '@/store/useSettingsStore';

type UnknownRecord = Record<string, unknown>;

function sanitizeText(value: string): string {
  return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').trim();
}

export function sanitizeLocalizedString(value: LocalizedString | undefined, languages: string[]): LocalizedString {
  return languages.reduce<LocalizedString>((accumulator, language) => {
    accumulator[language] = sanitizeText(value?.[language] ?? '');
    return accumulator;
  }, {});
}

export function mapBlogRow(row: UnknownRecord): BlogPost {
  return {
    id: typeof row.id === 'string' ? row.id : undefined,
    title: (row.title as LocalizedString | undefined) ?? { en: '' },
    excerpt: (row.excerpt as LocalizedString | undefined) ?? { en: '' },
    content: (row.content as LocalizedString | undefined) ?? { en: '' },
    imageUrl: typeof row.image_url === 'string'
      ? row.image_url
      : typeof row.imageUrl === 'string'
        ? row.imageUrl
        : '',
    author: typeof row.author === 'string' ? row.author : '',
    createdAt: typeof row.created_at === 'string'
      ? row.created_at
      : typeof row.createdAt === 'string'
        ? row.createdAt
        : new Date().toISOString(),
  };
}

export function mapPageRow(row: UnknownRecord): StaticPage {
  return {
    id: typeof row.id === 'string' ? row.id : undefined,
    title: (row.title as LocalizedString | undefined) ?? { en: '' },
    slug: typeof row.slug === 'string' ? row.slug : '',
    content: (row.content as LocalizedString | undefined) ?? { en: '' },
    updatedAt: typeof row.updated_at === 'string'
      ? row.updated_at
      : typeof row.updatedAt === 'string'
        ? row.updatedAt
        : new Date().toISOString(),
  };
}

export function slugify(value: string): string {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
