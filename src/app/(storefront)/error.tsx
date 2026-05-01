'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-red-50 rounded-none flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-sans font-bold text-brand-ink mb-2">Something went wrong</h1>
          <p className="text-brand-muted text-lg mb-8">
            We encountered an unexpected error while processing your request. Our team has been notified.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => reset()}
              className="flex-1 bg-brand-ink text-white px-8 py-4 rounded-none text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="flex-1 bg-white text-brand-ink border border-gray-200 px-8 py-4 rounded-none text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
