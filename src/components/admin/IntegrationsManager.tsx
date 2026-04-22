"use client";

import React from 'react';
import { IntegrationsContainer } from './integrations/IntegrationsContainer';

export function IntegrationsManager({ 
  initialConfig,
  activeLanguages 
}: { 
  initialConfig: Record<string, string>;
  activeLanguages?: string[];
}) {
  return (
    <div className="max-w-[1400px] mx-auto">
      <IntegrationsContainer
        key={JSON.stringify(initialConfig)}
        initialConfig={initialConfig}
        activeLanguages={activeLanguages}
      />
    </div>
  );
}
