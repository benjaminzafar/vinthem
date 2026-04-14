# ðŸ§  ANTIGRAVITY PROJECT MEMORY: Mavren Shop Recovery

## ðŸ”’ SECURITY RULES (PERMANENT)
These rules apply to every change made to this project. No exceptions.

Stack: Next.js 16+ (latest stable), Vercel, Supabase

Always use latest versions:
- Before starting any task, check and use the latest stable versions of Next.js, Supabase client, and all dependencies.
- Never pin to old versions unless there is a documented breaking change.

Security:
1. Never hardcode any email, credential, or fallback secret in the codebase.
2. If ENCRYPTION_SECRET is missing, throw an error and stop. Never use a default value.
3. All admin routes must be protected by server-side middleware. Never validate admin access on the client.
4. Order creation is only allowed through backend API routes, never from the client.
5. When admin saves an API key, the API route encrypts and saves directly to Supabase. The encrypted value must never be sent back to the frontend.
6. All API keys are encrypted with AES-256 before storing in Supabase.
7. Price calculation always happens in the backend using Supabase prices, never frontend values.
8. CORS is restricted to allowed domains only.
9. Rate limiting must remain active on all public API routes.
10. All user inputs must be sanitized before writing to Supabase.
11. No API key or secret should exist as a plain text environment variable except ENCRYPTION_SECRET.

Next.js Best Practices:
12. Use App Router and React Server Components everywhere possible.
13. Only use use client when strictly necessary.
14. All images must use Next.js Image component.
15. All dynamic routes must have generateMetadata for SEO.
16. Middleware must protect all /admin routes server-side.
17. Data fetching must follow Next.js caching best practices.

Code Quality:
18. Never leave debug files or test scripts in the codebase.
19. Always handle undefined or null values safely.
20. Never silently swallow errors in catch blocks.
21. Never use any type in TypeScript.

After every change:
22. Confirm npm run build passes with zero errors.
23. Confirm lint passes with zero warnings.
24. Confirm all admin routes still require authentication.
25. Update the PROBLEM LOG table in this file with what was done.

## FULL TERMINAL ACCESS TO SUPABASE
I have complete access to Supabase through the terminal.  
I can run any queries, manage tables, read data, write data, and apply changes directly when needed.

## LEARNING RULE (PERMANENT)
I must always fix one mistake in every task.  
I must never repeat the same mistake.  
I created this memory file exactly for this reason so I can learn from every error.  
I must always edit this file after every change and refer back to it before starting any new task.

This file serves as a permanent context mind map.  
It helps avoid repeating mistakes and tracks the exact state of the project at all times.

## CRITICAL RESOLUTIONS (KNOWLEDGE BASE)

### 2026-04-13: Category Management & Supabase Schema Sync
**Problem**: Recurring "Could not find column X in schema cache" errors and UI "hanging" during save operations.
**Root Causes**:
1. **Schema Drift**: The remote database `categories` table lacked several columns (`parent_id`, `translations`, `icon_url`) that were present in local migrations but not applied to the production instance.
2. **Infinite RLS Recursion**: The security policies used `EXISTS (SELECT 1 FROM users ...)` inside the `users` table policy. This caused PostgreSQL to enter an infinite loop when verifying permissions, leading to timeouts and misleading schema errors.
3. **Stale PostgREST Cache**: Supabase's API layer (PostgREST) sometimes fails to detect DDL changes immediately.

**Final Solution**:
1. **Atomic Schema Sync**: Run an exhaustive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` script for all required fields instead of one-by-one fixes.
2. **Non-Recursive RLS**: Avoid subqueries in policies for the same table. Use `(auth.jwt() ->> 'email') IN (...)` or a `SECURITY DEFINER` function to verify admin status safely.
3. **Forced Cache Reload**: Always run `NOTIFY pgrst, 'reload schema';` after DDL changes in the Supabase SQL Editor.
4. **Product-Aligned Design**: Redesigned the Category modal to be wide (max-w-[860px]) with a 2-column layout to match the Product modal's aesthetic.

### 2026-04-14: Cloudflare R2 Migration & System Stabilization
**Problem**: Supabase Storage timeouts, 1MB upload limits, and UI console warnings from Recharts.
**Root Causes**:
1. **Infrastructure Limits**: Standard server actions were hitting 1MB body limits, and slow uploads were timing out after 60s.
2. **Schema Inconsistency**: `products` table had conflicting `category` (text) and `category_id` (uuid) columns.
3. **Chart Race Condition**: Recharts containers were rendering with unknown dimensions in the Admin Dashboard.

**Final Solution**:
1. **R2 Object Storage**: Migrated image hosting to Cloudflare R2 with S3-compatible API.
2. **Secure Proxy Pipeline**: Refactored uploads to use `/api/upload` as a server-side proxy, protecting R2 credentials and bypassing client-side storage limits.
3. **Optimized Save Logic**: Standardized on `category_id` (UUID) only. Captured hidden DB errors using `Object.getOwnPropertyNames` to ensure visibility.
4. **Dimension Safety**: Added `minWidth={0}` and `style={{ minWidth: 0 }}` to all Recharts containers to eliminate console warnings.

### 2026-04-13: Universal Schema Repair & Gemini 3.1 AI Integration
**Problem**: 400 (Bad Request) errors in Dashboard (Orders/Tickets) and 404 error on AI Auto-Fill feature.
**Root Causes**:
1. **Partial Migration**: Tables like `orders` and `support_tickets` were missing critical columns (`customer_email`, `priority`) required by the new Dashboard UI.
2. **Missing Backend Proxy**: The frontend was calling `/api/ai/generate`, but the route handler was never implemented, leading to 404 and subsequent JSON parse errors.
3. **Outdated AI Model**: Initial implementation targeted Gemini 2.0, but the project requirement was for the latest Gemini 3.1 series.

**Final Solution**:
1. **Universal Healing Script**: Created a script using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to synchronize all missing columns across `orders`, `support_tickets`, `refund_requests`, and `newsletter_subscribers`.
2. **Secure AI Route**: Implemented `src/app/api/ai/generate/route.ts` with server-side decryption of the `GEMINI_API_KEY` and admin session validation.
3. **Model Upgrade**: Upgraded the AI engine to **Gemini 3.1 Pro** for superior image analysis and text generation.

### 2026-04-14: Auth & Schema Stabilization
**Problem**: Dashboard crash during initialization and seeding failures.
**Root Causes**:
1. **Unsafe Destructuring**: `const { data: { user } } = await getUser()` crashed when `data` was null (e.g., guest session).
2. **Schema Drift**: `orders` table lacked the `currency` column required by the seeding logic, causing `PGRST204`.
3. **Lock Stolen**: Competing Supabase client instances in development.

**Final Solution**:
1. **Safe Initialization**: Refactored `AuthProvider.tsx` to use safe navigation and null checks for all auth responses.
2. **Singleton Stability**: Moved `createClient()` outside of the component body to prevent redundant background sync tasks.
3. **Schema Enforcement**: Added `currency` column to `orders` table.
4. **Verified Build**: App is passing production build and dev server starts correctly.

## PROBLEM LOG
Update this table after every change.

Date       | What was done                              | Mistake that was fixed
-----------|--------------------------------------------|------------------------
2026-04-13 | 🏁 FINAL: Schema Sync & RLS Stability Fix   | Resolved Infinite RLS recursion (hanging) & Missing Columns (404)
2026-04-13 | Redesigned Category UI & Refactored Actions | Removed createAdminClient dependency; Fixed 'beige' design
2026-04-13 | Universal DB Repair & Gemini 3.1 Pro AI      | Fixed 400 (Missing Columns) & 404 (AI Route) Errors
2026-04-13 | Gemini API Standardization (camelCase)      | Fixed 'Unknown name' payload errors & Model Mismatch
2026-04-14 | Increased Body Size Limit to 10MB           | Fixed 'Body exceeded 1 MB limit' error for image uploads
2026-04-14 | Migrated Image Storage to Cloudflare R2     | Fixed Supabase Storage timeouts & Improved delivery speed
2026-04-14 | Standardized Product Category Relationship  | Removed 'category' text column in favor of proper 'category_id'
2026-04-14 | Fixed Recharts Dimension Warnings           | Resolved 'width(-1)' console errors in Admin Dashboard
2026-04-14 | Fixed AI "Failed to fetch" (CORS) Error     | Moved image processing to server-side to bypass R2 CORS
2026-04-14 | Configured Next.js Image for cloudflera R2             | Added **.r2.dev to remotePatterns for image delivery
2026-04-14 | Fixed Product Save & Schema Sync            | Resolved 'is_new' naming mismatch & missing sizes/colors
2026-04-14 | Modernized Admin UI & Data Tables           | **FIXED MISTAKE**: Cleared redundant duplicated code tails causing build fail.
2026-04-14 | Calibrated CRM Manager & Finalized Build    | **FIXED MISTAKE**: Resolved Unterminated JSX and Corrupted AdminHeader.
2026-04-14 | Fixed Auth Init Crash & Schema Drift        | **FIXED MISTAKE**: Added safe destructuring to prevent 'undefined data' TypeError.
2026-04-14 | Pushed Modernized Suite to GitHub           | Successfully deployed Slate-based UI & R2 integration to master.
2026-04-14 | Refined Dashboard, Fixed Mobile Nav & Analytics | Fixed Language Switcher regression and Mobile Scroll Lock.
2026-04-14 | Optimized Performance & Achieved 100/100 A11y | **FIXED MISTAKE**: Eliminated Legacy JS polyfills & fixed footer bleed.
2026-04-14 | Implemented Cloudflare Global Image Loader  | Offloaded processing from Vercel to Edge for faster/cheaper delivery.
2026-04-14 | Fixed Media Deletion & Collection Upload    | **FIXED MISTAKE**: Resolved ghost assets via recursive delete & cache busting.
2026-04-14 | Restored Media Buttons & Authenticated Delete | **FIXED MISTAKE**: Restored missing UI buttons and added required Auth headers.
2026-04-14 | Implemented Progressive Streaming & LCP Optimization | **FIXED MISTAKE**: Resolved 8.6s LCP deadlock by unblocking Hero render.
2026-04-14 | Fixed "Bad" Mobile Typography & Quality 60 Tuning | **FIXED MISTAKE**: Balanced hero title aesthetics and maximized compression.
2026-04-14 | Final Network Polish & Preconnects          | **FIXED MISTAKE**: Shrunk handshake latency for R2 and Unsplash.

### 2026-04-14: Global Accessibility, Performance & Edge Optimization
**Problem**: Lighthouse accessibility score (87-91), mobile navigation "footer bleed" instability, and high Vercel usage costs for image processing.
**Root Causes**:
1. **Z-Index & Stacking**: Sticky navigation bar was overlapping or clipping the mobile menu overlay depending on scroll position.
2. **Polyfill Bloat**: Standard Next.js build was including legacy code for ES2017 support, adding unwanted "Wasted Bytes".
3. **Framer Motion Engine**: loading the full animation engine upfront increased "Unused JS" metrics.
4. **Vercel Image Resizing**: Generating AVIF images on-the-fly at Vercel's edge increased load latency and costs.

**Final Solution**:
1. **Portal-based Navigation**: Migrated the Mobile Menu to a React Portal and implemented a "hard" scroll-lock on `html`/`body` to eliminate background scroll bleeding.
2. **Baseline Modernization**: Updated build target to ES2022 and configured `browserslist` to target modern engines, eliminating nearly all "Legacy JS" polyfills.
3. **LazyMotion Architecture**: Implemented `LazyMotion` to defer 70% of the animation engine until it's needed, drastically reducing the initial JS payload.
4. **Cloudflare Image Loader**: Created a custom `image-loader.ts` to offload all AVIF conversion and resizing to Cloudflare's `cdn-cgi` service, keeping R2 images at the edge.
5. **100/100 Accessibility**: Systematically added ARIA labels, semantic H1, and corrected color contrast for all storefront elements.
