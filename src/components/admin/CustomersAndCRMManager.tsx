"use client";

import React from 'react';
import { CRMData } from '@/types';
import { CRMContainer } from './crm/CRMContainer';

export function CustomersAndCRMManager({ initialData }: { initialData?: CRMData }) {
  return (
    <CRMContainer initialData={initialData} />
  );
}
