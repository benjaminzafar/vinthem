"use client";

import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

export const Portal = ({ children }: PortalProps) => {
  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
};
