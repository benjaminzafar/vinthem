"use client";

import React from 'react';
import { IntegrationsContainer } from './integrations/IntegrationsContainer';

export function IntegrationsManager({ initialConfig }: { initialConfig: Record<string, string> }) {
  return (
    <div className="max-w-[1400px] mx-auto">
      <IntegrationsContainer
        key={JSON.stringify(initialConfig)}
        initialConfig={initialConfig}
      />
    </div>
  );
}
