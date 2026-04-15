"use client";

import React from 'react';
import { CRMContainer } from './crm/CRMContainer';

export function CustomersAndCRMManager() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <CRMContainer />
      </main>
    </div>
  );
}
