# 🧠 ANTIGRAVITY PROJECT MEMORY: Mavren Shop Recovery

> [!IMPORTANT]
> This file is a **Permanent Context Mind Map**. It tracks the project's evolution, prevents repeating past mistakes, and enforces the latest architectural standards. **Read it before every task.**

---

## 🔒 SECURITY RULES (PERMANENT)
*These rules apply to every change. No exceptions.*

### 🛠️ Technology Stack
- **Framework**: Next.js 16+ (latest stable)
- **Deployment**: Vercel
- **Database/Auth**: Supabase

### 🛡️ Security Protocol
1. **No Credentials**: Never hardcode emails, API keys, or fallback secrets.
2. **Encryption Focus**: `ENCRYPTION_SECRET` must exist. All API keys are AES-256 encrypted before storage.
3. **Backend Only**: 
   - Admin routes must be protected by **server-side middleware**.
   - Order creation and sensitive data writes (Products/Categories) must use **Server Actions**, never client-side SDK calls.
4. **Calculations**: Price and shipping calculations always happen in the **backend**.
5. **Sanitization**: All user inputs must be sanitized before writing to Supabase.
6. **No Plaintext**: No API keys or secrets should exist as plain text environment variables except for `ENCRYPTION_SECRET`.

### ⚡ Next.js Best Practices
- **Server Components**: Use RSC everywhere possible. `use client` is the last resort.
- **Images**: Always use the Next.js `Image` component.
- **SEO**: Dynamic routes must include `generateMetadata`.
- **Caching**: Data fetching must follow standard Next.js caching patterns.

---

### 2026-04-16: 'Deep Intelligence' & Real-Time Analytics Sync
**Problem**: The CRM dashboard was purely informational but lacked live traffic awareness and behavioral insights (recordings).
**Final Solution**:
1. **Integrated Intelligence Dashboard**: Overhauled `CRMAnalytics.tsx` with live Recharts-driven Traffic Pulse (24h) and Source Origins mapping.
2. **True Real-Mode Migration**: Implemented a secure proxy (`/api/admin/intelligence/traffic`) linking directly to the PostHog EU API. Completely eliminated mock fallbacks when keys are present.
3. **Microsoft Clarity Integration**: Globally embedded behavioral sidecar for visual recordings. IDs are fetched server-side from Supabase, allowing no-code updates.
4. **Global Hydration & Settings**: 
   - Expanded the master **Integrations Dashboard** with PostHog and Clarity config cards.
   - Implemented `lib/data.ts` (getIntegrations) to hydrate `RootLayout` with dynamic tracking scripts.
   - All keys are secured using the platform's **AES-256-GCM encryption** protocol.
5. **Identity Identity Sync**: Linked Supabase auth users to PostHog and Clarity sessions, enabling identity-aware behavioral mapping in the CRM.

### 2026-04-16: Admin List Zero-Latency SSR
**Problem**: Products, Collections, and Orders lists appeared empty or stuck on spinners when the browser was refreshed due to client-side-only fetching.
**Final Solution**:
1. **Server-Side Hydration**: Migrated initial data fetching for all core admin lists into the `AdminTabPage` (Server Component).
2. **Prop Injection & Hydration**: Updated `ProductManager`, `CollectionManager`, and `OrderManager` to accept and prioritize `initialData` props.
3. **Optimized Reload**: Data is now present in the HTML upon delivery, ensuring the UI is populated instantly on refresh while maintaining Realtime sync.

### 2026-04-16: Media Center Infinite Stream & Zero-Lag Grid
**Problem**: The Media Center attempted to load 1000 items simultaneously, causing severe browser lag, slow initial paint times, and excessive memory usage.
**Final Solution**:
1. **Batch Size Optimization**: Reduced API `MaxKeys` from 1000 to 50 in `route.ts`, ensuring ultra-fast initial response times.
2. **Pagination Engine**: Refactored `MediaContainer.tsx` to utilize `continuationToken` logic, enabling seamless appending of asset batches.
3. **Infinite Scroll Mechanism**: Implemented `IntersectionObserver` in `AssetGrid.tsx` to trigger background loading only when the user approaches the bottom of the grid.
4. **Visual Continuity**: Integrated skeleton loading placeholders to maintain structural integrity during background fetches.

### 2026-04-16: Admin-Wide Infinite Scrolling & Backend Search
**Problem**: Products, Orders, and Collections management lists were client-side heavy, loading entire datasets into memory and freezing the UI during hydration.
**Final Solution**:
1. **Universal Sentinel Component**: Created `InfiniteScrollSentinel.tsx` as a standard for all admin lists.
2. **Supabase Range Fetching**: Migrated `ProductManager`, `OrderManager`, and `CollectionManager` to use Supabase `.range(from, to)` to fetch data in manageable 50-item batches.
3. **Hybrid Backend Search**: Moved search logic for Products and Orders to the database (`.ilike()`), allowing instant "Search All" functionality without loading the whole list.
4. **Hierarchical Pagination**: Implemented root-level streaming for categories to maintain the catalogue tree while improving collection management speed.

---

## 🚀 CRITICAL RESOLUTIONS (KNOWLEDGE BASE)

### 2026-04-15: Product & Collection Editor Migration (Backend Hardening)
**Problem**: Saving products and collections via modals was brittle, and client-side Supabase writes were blocked by RLS/Secure Middleware.
**Final Solution**:
1. **Dedicated Routes**: Migrated `CollectionManager` and `ProductManager` to full-screen editors (`/admin/collections/[id]`, `/admin/products/[id]`).
2. **Server Action Pattern**: Standardized on `saveProductAction` and `saveCategoryAction`. This pattern ensures all writes bypass RLS in a trusted environment while enforcing server-side validation.
3. **Schema Sync**: Manually hardened the database with the `status` column (`published`/`draft`) and matched camelCase frontend properties to snake_case database columns.

### 2026-04-15: Professional AI Resilience & Humanized Reporting
**Problem**: Intermittent AI Rate Limits (429) or Congestion (503) provided generic feedback, and configuration errors (401) were unnecessarily technical.
**Final Solution**:
1. **Intelligent Branching**: Implemented a "Humanized" error handler that distinguishes between **Setup Errors** and **Service Errors**.
2. **Simplified Config Errors**: 401 (Invalid Key) and 403 (Unauthorized) now show a direct, friendly instructions: *"Action Required: Please set your Groq API Key in Integrations"*.
3. **Structured Debugging**: Maintained markdown-style headers (`## Error Type`, `## Error Message`) and timestamps *only* for difficult service issues (429/503) to aid professional debugging without cluttering the UI for simple setup fixes.

### 2026-04-15: Modular Integrations Architecture & Security Hardened
**Problem**: The monolithic `IntegrationsManager.tsx` was buggy, insecure (keys potentially exposed), and had broken "Test" buttons.
**Final Solution**:
1. **Component Decomposition**: Refactored into a modular system (`IntegrationCard`, `CredentialInput`, `IntegrationsContainer`).
2. **Fixed Critical Bugs**: Replaced dead client-side `fetch` routes with secure **Server Actions** for Stripe and Email (SMTP) validation.
3. **One-Way Security**: Implemented masking where API keys are never returned as plain text from the database after being saved.
4. **Premium "WOW" UI**: Added a categorized grid layout, professional SVG logos for 13 services, and search-driven navigation.

---

## 📝 PROBLEM LOG
*Update this table after every successful task.*

Date       | What was done                              | Mistake that was fixed
-----------|--------------------------------------------|------------------------
2026-04-16 | **Profile Mobile Nav & Address Actions** | **FIXED MISTAKE**: Removed duplicated profile CTA/navigation patterns on mobile and completed the unfinished address area by wiring add/edit/delete/default flows to authenticated Server Actions instead of leaving a dead "Add New Address" button.
2026-04-16 | **Cookie Banner Admin Hydration Fix** | **FIXED MISTAKE**: Prevented the simplified cookie banner from server-rendering inside the root layout by mounting it through a client-only wrapper, eliminating admin-side hydration mismatches against SSR content.
2026-04-16 | **OAuth Callback Recovery** | **FIXED MISTAKE**: Stopped the Google auth callback from crashing locally when `SUPABASE_SERVICE_ROLE_KEY` is absent by making post-login profile sync best-effort instead of blocking the session exchange redirect.
2026-04-16 | **Minimal Auth & Cookie Banner Rollback** | **FIXED MISTAKE**: Reverted the affected user-facing controls to a simpler path by restoring Google auth availability by default, making auth buttons explicit, and replacing the complex consent UI with a lightweight cookie banner that cannot block the whole storefront.
2026-04-16 | **Storefront Translation Runtime Removal** | **FIXED MISTAKE**: Removed the remaining `react-i18next` runtime dependency from the shared language switcher so navigation no longer relies on a global i18n instance during storefront hydration.
2026-04-16 | **Emergency Storefront Interaction Rollback** | **FIXED MISTAKE**: Removed the root-level consent overlay from the public layout after it remained the most likely global interaction blocker, prioritizing site usability before reintroducing consent UI in a safer form.
2026-04-16 | **Storefront i18n Runtime Cleanup** | **FIXED MISTAKE**: Removed `react-i18next` instance assumptions from critical storefront client paths (`auth`, `reviews`, consent locale flow) and restored the locale cookie helper so runtime translation errors no longer destabilize clicks or builds.
2026-04-16 | **Consent Runtime Interaction Fix** | **FIXED MISTAKE**: Removed the unstable `react-i18next` dependency from the root-level consent manager and switched it to server-provided locale so hydration no longer risks breaking clicks across the storefront.
2026-04-16 | **OAuth Guard & Policy Localization Upgrade** | **FIXED MISTAKE**: Stopped exposing users to the broken `disabled_client` Google OAuth flow by gating the storefront button behind an admin-controlled toggle, and moved consent/policy copy plus privacy/cookie/terms page content into localized storefront settings with live page sync.
2026-04-16 | **Consent, Newsletter & Unsubscribe Hardening** | **FIXED MISTAKE**: Replaced the old email-only newsletter insert and always-on analytics with explicit signup/newsletter consent capture, a real unsubscribe flow, footer cookie controls, and consent-gated PostHog/Clarity behavior backed by a Supabase migration.
2026-04-16 | **CRM & Customer Workspace Repair** | **FIXED MISTAKE**: Replaced brittle CRM field assumptions (`customer_email`, weak customer mapping, inert refund controls) with real user-linked enrichment, working admin ticket/refund actions, and a more complete customer profile workspace UI.
2026-04-16 | **Security Hardening Phase 7** | **FIXED MISTAKE**: Applied the prepared Supabase RLS/storage hardening migration to the linked remote project so the stricter database protections are now active, not just committed in code.
2026-04-16 | **Security Hardening Phase 6** | **FIXED MISTAKE**: Removed the remaining admin-side ticket update path from the browser, added optional distributed rate limiting with Upstash fallback, and prepared a strict Supabase RLS/storage migration to eliminate overly broad insert policies.
2026-04-16 | **Security Hardening Phase 5** | **FIXED MISTAKE**: Replaced the overly broad CSP and one-size-fits-all API limiter with a nonce-based CSP, stricter domain allowlists, route-aware rate limits, and bounded in-memory cleanup to reduce abuse surface without breaking production.
2026-04-16 | **Security Hardening Phase 4** | **FIXED MISTAKE**: Removed the remaining browser-side writes for refund status changes and customer review submission by routing both flows through validated server actions.
2026-04-16 | **Security Hardening Phase 3** | **FIXED MISTAKE**: Removed the last browser-side bulk collection deletion path by moving admin collection deletes into a server action and keeping admin authorization on the server.
2026-04-16 | **Security Hardening Phase 2** | **FIXED MISTAKE**: Removed more browser-side writes from signup/profile/review flows by moving user-profile sync, support/refund submission, and admin fake-review creation behind server actions.
2026-04-16 | **Security Hardening Phase 1** | **FIXED MISTAKE**: Removed several admin-side browser writes for orders, product deletion, and database test-data tools by moving them to server actions, and added baseline browser security headers in middleware.
2026-04-16 | **Refactored Journal & Pages Into Full Editors** | **FIXED MISTAKE**: Removed the old modal-based blog/pages admin flow that was hiding broken date mappings and list/editor state bugs; replaced it with collection-style lists plus dedicated editor routes and server-side admin save/delete actions.
2026-04-16 | **Repaired CRM PostHog Feed & Admin Panel Build** | **FIXED MISTAKE**: Stopped encrypting non-secret PostHog fields (`POSTHOG_HOST`, `POSTHOG_PROJECT_ID`, `POSTHOG_PROJECT_KEY`) in the CRM save path, which had broken analytics queries and frontend tracking bootstrap.
2026-04-16 | **Admin-Wide Infinite Scroll Optimization** | **FIXED MISTAKE**: Resolved UI "freezes" by implementing backend range partials and fixed a code-mangling issue in `OrderManager.tsx` caused by a failed `multi_replace_file_content` block.
2026-04-16 | **Fixed ReferenceError in MediaContainer** | **FIXED MISTAKE**: Restored core state variables (`currentPath`, `loading`, etc.) that were accidentally deleted during code refactor.
2026-04-16 | **Infinite Media Stream & Performance Fix** | **FIXED MISTAKE**: Eliminated browser "freeze" and high memory usage by replacing monolithic 1000-item loads with a 50-item infinite scroll system.
2026-04-16 | **Deep Intelligence & Identity Sync**      | **FIXED MISTAKE**: Resolved 404/ReferenceErrors caused by incorrect PostHog host and case-insensitive key naming (unified to UPPERCASE).
2026-04-16 | **Unified Analytics Architecture**         | **FIXED MISTAKE**: Eliminated 'Fake Data' complaints by removing mock fallbacks whenever API keys are present.
2026-04-15 | **Modularized CRM & Aligned with Overview Style** | **FIXED MISTAKE**: Eliminated monolithic dashboard lag and resolved aesthetic mismatches.
2026-04-15 | **Universal AI & Storefront Localization** | **FIXED MISTAKE**: Decentralized AI tools to be available for every field and fixed a `Package` icon import error that broke the build.
2026-04-15 | **Modular Integrations Refactor**         | **FIXED MISTAKE**: Eliminated the buggy monolith and fixed dead "Test Connection" buttons by implementing Server Actions.
2026-04-15 | **Total Gemini Removal & Groq Migration** | **FIXED MISTAKE**: Resolved persistent 503/429 errors by removing Google AI and migrating the entire platform to Groq Cloud LPU infrastructure.
2026-04-15 | **Admin Editor Route Migration**           | **FIXED MISTAKE**: Migrated from brittle modals to full-screen `/admin/collections/[id]` and `/admin/products/[id]`, resolving state-loss issues.
2026-04-15 | **Server Action Write Migration**          | **FIXED MISTAKE**: Replaced client-side Supabase writes with `saveProductAction` and `saveCategoryAction` to bypass RLS blocks and ensure security Rule #5.
2026-04-15 | **Professional AI Error Formatting**       | **FIXED MISTAKE**: Replaced generic error toasts with structured, timestamped markdown logs (`## Error Type`, `## Error Message`) for 429/503 errors.
2026-04-15 | **Schema Hardening: Status Column**        | **FIXED MISTAKE**: Proactively added the `status` column to the `products` table via SQL to allow Draft/Published modes without save failures.
2026-04-15 | AI Advanced Variant Data Extraction        | **FIXED MISTAKE**: Upgraded `VariantEditor.tsx` to handle complex SKU and price parsing from Swedish product narratives.
2026-04-15 | AI Model Choice Restoration                | **FIXED MISTAKE**: Removed aggressive model overrides, restoring user control over Gemini preferences.
2026-04-15 | Variant Photo Library & Sync Fix           | **FIXED MISTAKE**: Integrated Media Library into the Variant Editor and fixed color-based photo propagation.
2026-04-15 | Unified AI Designer Unification            | **FIXED MISTAKE**: Removed duplicate AI generation flows and fixed `options` persistence bug.
2026-04-15 | Security Hardening & Admin Auth Centralization | **FIXED MISTAKE**: Removed hardcoded backdoors and moved admin enforcement to shared server-side middleware.
2026-04-14 | Structural Hero Mobile Overhaul            | **FIXED MISTAKE**: Resolved 'floating space' via justify-start layout.
2026-04-14 | Optimized Featured Products Query          | **FIXED MISTAKE**: Reduced home page query lag from 10s to <200ms using `.limit(4)` and backend filters.
2026-04-14 | Cloudflare Image Loader Integration        | **FIXED MISTAKE**: Offloaded AVIF conversion and resizing to Cloudflare to reduce Vercel compute costs.

---

## 💡 LEARNINGS & RULES (PERMANENT)

> [!TIP]
> **Zero Repeat Rule**: I must always fix one mistake in every task and never repeat it. Every error is a lesson documented here.

> [!TIP]
> **Persistence Standard**: Always use Server Actions for Admin writes. The browser SDK should be reserved for public `SELECT` queries only to ensure RLS compliance and backend validation.

> [!TIP]
> **Aesthetics Rule**: Modern web design (flat design, rounded 4px, high-contrast typography) is NOT optional. The USER should be wowed by the UI.
