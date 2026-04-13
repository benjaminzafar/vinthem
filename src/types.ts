import { LocalizedString, StorefrontSettings } from '@/store/useSettingsStore';

export type StorefrontSettingsType = StorefrontSettings;
export { type LocalizedString };

export interface Category {
  id?: string;
  name: string;
  description?: string;
  translations?: {
    [lang: string]: {
      name: string;
      description?: string;
    };
  };
  isFeatured: boolean;
  showInHero?: boolean;
  parentId?: string;
  imageUrl?: string;
  iconUrl?: string;
}

export interface BlogPost {
  id?: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  imageUrl: string;
  author: string;
  createdAt: string;
}

export interface StaticPage {
  id?: string;
  title: LocalizedString;
  slug: string;
  content: LocalizedString;
  updatedAt: string;
}

export interface Review {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  adminReply?: string;
  adminReplyAt?: string;
}
