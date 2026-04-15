"use client";

import React from 'react';
import { StorefrontContainer } from './storefront/StorefrontContainer';

/**
 * StorefrontSettings - Modular Wrapper
 * This component has been refactored into a scalable, card-based architecture.
 * Context management and state orchestration are now handled in StorefrontContainer.
 */
export function StorefrontSettings() {
  return <StorefrontContainer />;
}
