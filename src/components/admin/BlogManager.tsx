"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Edit, Plus, Search, Sparkles, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

import { deleteBlogPostsAction } from '@/app/actions/blog-posts';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { useDebounce } from '@/hooks/useDebounce';
import { BlogPost } from '@/types';
import { isValidUrl } from '@/lib/utils';
import { toMediaPublicUrl } from '@/lib/media';

type BlogManagerProps = {
  initialPosts?: BlogPost[];
};

export function BlogManager({ initialPosts = [] }: BlogManagerProps) {
  const router = useRouter();
  const customConfirm = useCustomConfirm();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const filteredPosts = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    return posts.filter((post) => {
      return (
        post.title.en?.toLowerCase().includes(query) ||
        Object.values(post.title).some((value) => value.toLowerCase().includes(query)) ||
        post.author.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearchQuery, posts]);

  const toggleAllPosts = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
      return;
    }

    setSelectedPosts(filteredPosts.map((post) => post.id ?? '').filter(Boolean));
  };

  const togglePostSelection = (id: string) => {
    setSelectedPosts((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };

  const handleDelete = async (ids: string[]) => {
    const confirmed = await customConfirm('Delete Journal Entries', `Delete ${ids.length} journal entr${ids.length === 1 ? 'y' : 'ies'}?`);
    if (!confirmed) {
      return;
    }

    const toastId = toast.loading('Removing journal entries...');
    const result = await deleteBlogPostsAction(ids);

    if (!result.success) {
      toast.error(result.message, { id: toastId });
      return;
    }

    setPosts((current) => current.filter((post) => !ids.includes(post.id ?? '')));
    setSelectedPosts((current) => current.filter((id) => !ids.includes(id)));
    toast.success(result.message, { id: toastId });
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[18px] font-bold leading-none tracking-tight text-slate-900">Journal</h1>
          <p className="mt-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Editorial Library & Storytelling</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="group relative flex-1 md:flex-none">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-900" />
            <input
              type="text"
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full md:w-64 rounded-none-[4px] border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-900 transition-all focus:border-slate-900 focus:outline-none"
            />
          </div>
          <button
            onClick={() => router.push('/admin/blogs/new')}
            className="flex h-11 items-center justify-center gap-2 rounded-none-[4px] bg-slate-900 px-6 sm:px-8 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Entry
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-none-[4px] border border-slate-200 bg-white">
        <div className="flex min-h-14 flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-3 sm:py-0 gap-2">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-slate-500" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Editorial Archive</h3>
          </div>
          <div className="flex items-center gap-4">
            {selectedPosts.length > 0 && (
              <button
                onClick={() => void handleDelete(selectedPosts)}
                className="text-[11px] font-bold uppercase tracking-widest text-rose-600 hover:underline"
              >
                Delete Selected ({selectedPosts.length})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={filteredPosts.length > 0 && selectedPosts.length === filteredPosts.length}
                    onChange={toggleAllPosts}
                    className="h-4 w-4 rounded-none border-slate-300"
                  />
                </th>
                <th className="px-6 py-4">Story</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Published</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    No journal entries found
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => router.push(`/admin/blogs/${post.id}`)}
                  >
                    <td
                      className="px-6 py-4"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id ?? '')}
                        onChange={() => {
                          if (post.id) {
                            togglePostSelection(post.id);
                          }
                        }}
                        className="h-4 w-4 rounded-none border-slate-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-16 overflow-hidden rounded-none-[4px] border border-slate-200 bg-slate-50">
                          {isValidUrl(toMediaPublicUrl(post.imageUrl)) ? (
                            <Image src={toMediaPublicUrl(post.imageUrl)} alt="" fill sizes="128px" className="object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold tracking-tight text-slate-900">{post.title.en || 'Untitled story'}</p>
                          <p className="mt-1 line-clamp-2 max-w-[360px] text-[12px] text-slate-500">{post.excerpt.en || 'No excerpt yet.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 rounded-none-[4px] border border-slate-100 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        <User className="h-3 w-3" />
                        {post.author}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/admin/blogs/${post.id}`);
                          }}
                          className="p-2 text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (post.id) {
                              void handleDelete([post.id]);
                            }
                          }}
                          className="p-2 text-slate-300 transition-all hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
