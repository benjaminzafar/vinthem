import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 shrink-0 space-y-10">
          <div className="h-10 bg-gray-200 rounded-xl w-full" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-48 mb-8 hidden lg:block" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="flex flex-col space-y-4">
                <div className="aspect-[4/5] bg-gray-200 rounded-2xl w-full" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
