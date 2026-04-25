"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Edit, FileCode, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deletePagesAction, seedPagesAction } from '@/app/actions/pages';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useSettingsStore } from '@/store/useSettingsStore';
import { downloadXLSX } from '@/utils/export';
import { StaticPage } from '@/types';

type PageManagerProps = {
  initialPages?: StaticPage[];
};

export function PageManager({ initialPages = [] }: PageManagerProps) {
  const router = useRouter();
  const customConfirm = useCustomConfirm();
  const settings = useSettingsStore((state) => state.settings);
  const [pages, setPages] = useState<StaticPage[]>(initialPages);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  const filteredPages = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    return pages.filter((page) => {
      return (
        page.slug.toLowerCase().includes(query) ||
        Object.values(page.title).some((value) => value.toLowerCase().includes(query))
      );
    });
  }, [debouncedSearchQuery, pages]);

  const toggleAllPages = () => {
    if (selectedPages.length === filteredPages.length) {
      setSelectedPages([]);
      return;
    }

    setSelectedPages(filteredPages.map((page) => page.id ?? '').filter(Boolean));
  };

  const togglePageSelection = (id: string) => {
    setSelectedPages((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };

  const handleDelete = async (ids: string[]) => {
    const confirmed = await customConfirm('Delete Pages', `Delete ${ids.length} static page${ids.length === 1 ? '' : 's'}?`);
    if (!confirmed) {
      return;
    }

    const toastId = toast.loading('Removing pages...');
    const result = await deletePagesAction(ids);

    if (!result.success) {
      toast.error(result.message, { id: toastId });
      return;
    }

    setPages((current) => current.filter((page) => !ids.includes(page.id ?? '')));
    setSelectedPages((current) => current.filter((id) => !ids.includes(id)));
    toast.success(result.message, { id: toastId });
    router.refresh();
  };

  const handleSeedDefaults = async () => {
    const toastId = toast.loading('Seeding default pages...');
    const result = await seedPagesAction();

    if (!result.success) {
      toast.error(result.message, { id: toastId });
      return;
    }

    toast.success(result.message, { id: toastId });
    setSelectedPages([]);
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[18px] font-bold leading-none tracking-tight text-slate-900">Pages</h1>
          <p className="mt-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Policies, Support & Informational Content</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="group relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-64 rounded-[4px] border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-900 transition-all focus:border-slate-900 focus:outline-none"
            />
          </div>
          <button
            onClick={() => router.push('/admin/pages/new')}
            className="flex h-11 items-center gap-2 rounded-[4px] bg-slate-900 px-8 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Page
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6">
          <div className="flex items-center gap-3">
            <FileCode className="h-4 w-4 text-slate-400" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Page Library</h3>
          </div>
          <div className="flex items-center gap-4">
            {selectedPages.length > 0 && (
              <button
                onClick={() => void handleDelete(selectedPages)}
                className="text-[11px] font-bold uppercase tracking-widest text-rose-600 hover:underline"
              >
                Delete Selected ({selectedPages.length})
              </button>
            )}
            <button
              onClick={() => void handleSeedDefaults()}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900"
            >
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
              Seed Defaults
            </button>
            <button
              onClick={() => downloadXLSX(filteredPages, 'pages')}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900"
            >
              <Download className="mr-1 inline h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={filteredPages.length > 0 && selectedPages.length === filteredPages.length}
                    onChange={toggleAllPages}
                    className="h-4 w-4 rounded-sm border-slate-300"
                  />
                </th>
                <th className="px-6 py-4">Page</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[4px] border border-slate-100 bg-slate-50">
                      <FileCode className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-900">
                      {settings.noPagesYetText?.en || 'No pages yet'}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {settings.noPagesDescriptionText?.en || 'Add a page manually or seed default pages to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr
                    key={page.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => router.push(`/admin/pages/${page.id}`)}
                  >
                    <td
                      className="px-6 py-4"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPages.includes(page.id ?? '')}
                        onChange={() => {
                          if (page.id) {
                            togglePageSelection(page.id);
                          }
                        }}
                        className="h-4 w-4 rounded-sm border-slate-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-slate-200 bg-slate-50">
                          <FileCode className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold tracking-tight text-slate-900">{page.title.en || 'Untitled page'}</p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Static content node</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex rounded-[4px] border border-slate-100 bg-white px-2.5 py-1 font-mono text-[10px] font-bold text-slate-500">
                        /p/{page.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-500">
                      {new Date(page.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/admin/pages/${page.id}`);
                          }}
                          className="p-2 text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (page.id) {
                              void handleDelete([page.id]);
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
