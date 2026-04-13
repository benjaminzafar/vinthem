import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
      <div className="text-center mb-16 space-y-4">
        <div className="h-10 bg-gray-200 rounded-full w-48 mx-auto" />
        <div className="h-4 bg-gray-100 rounded-full w-96 mx-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col space-y-6">
            <div className="aspect-[16/10] bg-gray-200 rounded-2xl w-full" />
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-6 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-brand-muted">
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
