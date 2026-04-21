import type { Metadata } from "next";
import { Suspense } from "react";
import { UnsubscribeClient } from "./UnsubscribeClient";

export const metadata: Metadata = {
  title: "Unsubscribe | Vinthem",
  description: "Manage your Vinthem marketing email preferences.",
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeClient />
    </Suspense>
  );
}
