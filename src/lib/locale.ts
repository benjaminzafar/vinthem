"use client";

export function getClientLocale(): string {
  if (typeof document === "undefined") {
    return "en";
  }

  const localeCookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("NEXT_LOCALE="));

  return localeCookie ? decodeURIComponent(localeCookie.split("=")[1] ?? "en") : "en";
}

export function persistLocaleCookie(locale: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
