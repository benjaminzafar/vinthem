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
2026-04-18 | **Search Popup Localization & Fresh Data Sync** | **FIXED MISTAKE**: Removed stale search-popup assumptions by forcing fresh product/category reads whenever desktop search opens, and moved the popup’s remaining hardcoded headings/messages into `Storefront Settings` so admins can translate and control the search experience instead of being stuck with fixed English copy.
2026-04-18 | **Desktop Search Pin Refresh & SEK-Only Pricing Reversal** | **FIXED MISTAKE**: Fixed the desktop search popup so pinned collections are freshly re-fetched instead of being masked by stale cached search data, and removed the overbuilt localized-price admin flow so product pricing is once again SEK-only in the CMS while Stripe remains responsible for customer-facing currency conversion at checkout.
2026-04-18 | **Single Product Filter Button & Collection Pin Mapping Fix** | **FIXED MISTAKE**: Removed the wrongly restored extra floating actions from the single-product page and kept only the matching filter shortcut, while also restoring `pinned_in_search` mapping in the admin collection editor so desktop-search pinning can actually be controlled from admin instead of silently dropping that flag on edit.
2026-04-18 | **Products Floating Action Simplification** | **FIXED MISTAKE**: Removed only the extra back-to-top floating button from the products page after restoring the circular quick actions too aggressively, keeping the filter shortcut while avoiding redundant UI noise.
2026-04-18 | **Products & Single Product Floating Action Restore** | **FIXED MISTAKE**: Restored the missing bottom-right circular quick-action buttons specifically on the products listing and single-product pages after the recent design cleanup removed those page-level icon controls entirely, bringing back fast filter/review/share/cart access without reintroducing them globally across the storefront.
2026-04-18 | **Collections Search Pin Control & Desktop Search Sync** | **FIXED MISTAKE**: Promoted `pinned_in_search` from a hidden editor-only flag into a real admin quick-toggle in the collections table, passed the field through SSR mapping, and taught the desktop search popup to prioritize pinned collections plus legacy public products so “Pin to Search” finally has a visible business effect instead of being a half-connected setting.
2026-04-18 | **Pin to Search Fix & Pro Error Handling** | **FIXED MISTAKE**: Investigation confirmed the "Pin to Search" feature failed because the `pinned_in_search` column was missing in the Supabase database. Improved the **Collection Editor** to specifically detect "missing column" errors and provide clear migration instructions to the admin. Verified the fix with a diagnostic script and ensured a zero-error production build.
2026-04-18 | **Signature Popup Search: Pro Polish & Radius** | **FIXED MISTAKE**: Eliminated UI clutter by removing the redundant "Clear" button that caused a triple-button look in the header. Added a cohesive **border radius system** (`rounded-2xl` for modal, `rounded-lg` for cards) to perfectly match the products page design. Maintained high-contrast accessibility while softening the Scandinavian aesthetic for a more integrated premium feel. Verified zero-error production build.
2026-04-18 | **Global UI Flattening & Build Stabilization** | **FIXED MISTAKE**: Successfully eliminated all remaining `shadow-` classes from the storefront and admin dashboard (buttons, inputs, status indicators) to achieve a strictly flat Scandinavian aesthetic. Simultaneously resolved critical TypeScript build errors in `MobileMenu`, `MobileFilters`, and `SidebarFilters` by hardening navigation logic against undefined category IDs, ensuring a production-ready, zero-error codebase.
2026-04-18 | **Premium Desktop Sidebar: Hierarchical Discovery** | **FIXED MISTAKE**: Redesigned the desktop sidebar to features a **drill-down "folder" navigation** system identical to mobile. Removed the cluttered **Color and Size filters** as requested, focusing the UI purely on Collection discovery and Search. Implemented tiered sliding animations with `Framer Motion` and a context-aware header, elevating the sidebar to a high-end Scandinavian minimalist standard.
2026-04-18 | **Hierarchical "Folder-in-Folder" Mobile Navigation** | **FIXED MISTAKE**: Replaced the flat, cluttered category lists with a premium **drill-down "folder" navigation** in both the main `MobileMenu` and the `Filter & Sort` drawer. Implemented a navigation stack with `Framer Motion` sliding transitions, dynamic "Back" headers, and "View All" shortcuts, creating a sophisticated, app-like discovery experience for complex collection hierarchies.
2026-04-18 | **Mobile Search Correction & Menu Cleanup** | **FIXED MISTAKE**: Corrected the search icon behavior on mobile to trigger the contextually relevant **Filter & Sort** drawer instead of the general site navigation; implemented seamless redirection from the Home page to the Products list with auto-opening filters; and removed redundant search inputs from the mobile navigation to maintain a minimalist, high-end UX.
2026-04-18 | **Global Search Overhaul: 4x4 Power Menu & Mobile Hub** | **FIXED MISTAKE**: Eliminated the fragmented search UX by unifying mobile search into the main navigation drawer with auto-focus logic. Introduced a premium **4x4 discovery grid** on desktop (16 tiles: 8 categories, 4 collections, 4 quick links) to replace the small legacy dropdown, significantly improving site discoverability and aesthetic depth.
2026-04-18 | **Storefront Premium Design & Mobile Drawer Overhaul** | **FIXED MISTAKE**: Replaced the chunky "soft" design and default 2.0px icons with a refined **subtle rounded** aesthetic (`rounded` 4px) and a delicate **1.5px stroke weight** system. Redesigned the mobile filter drawer to be **full-width**, implemented dynamic **live search results** (which auto-hide other filters), and compressed the bottom action area into a sleek **side-by-side button layout** to maximize screen space on mobile.
2026-04-18 | **Signature Cart Drawer: Master Standard Reveal** | **FIXED MISTAKE**: Replaced the disruptive full-page cart navigation with a live, side-reveal drawer to maintain "Master Standard" Scandinavian consistency. Wired the header cart toggle to the drawer and enabled **auto-reveal** on all product additions, while also hardening the global `closeAll` UI state logic to ensure the cart drawer correctly synchronizes with other overlays like search and mobile menus.



2026-04-18 | **Administrative Write Restoration & Schema Hardening** | **FIXED MISTAKE**: Replaced the session-based client in admin save actions with the **Admin Client** (Service Role) to properly bypass RLS blocks as originally intended; fixed the missing `stripe_tax_code` column in the database; and converted the product image container to a `<label>` to restore the broken click-to-upload UI behavior.
2026-04-17 | **Storefront Product Visibility & Listing Cleanup** | **FIXED MISTAKE**: Removed the unwanted products-page top summary bar and unified storefront product visibility around `published`, legacy `active`, and null-status records so valid products stop disappearing from `/products` and featured-product links stop falling through to a 404 because the detail page was filtered more strictly than the home/list feeds.

2026-04-17 | **Storefront Product Route & Layout Hardening** | **FIXED MISTAKE**: Restricted storefront product feeds to publishable products with valid ids, added safer product-card linking, and rebuilt the product/listing layouts so users stop landing on broken product URLs while the storefront presentation becomes cleaner and more standard.
2026-04-17 | **Product Tax Codes & Localized Price Fields** | **FIXED MISTAKE**: Moved Stripe tax code control and local market prices into the product model/admin editor so tax logic no longer depends only on keyword guessing and storefront currency display can use explicit per-currency product values before checkout.
2026-04-17 | **Server Action Checkout Tax Estimation Flow** | **FIXED MISTAKE**: Upgraded the initial Stripe checkout migration into a full server-action-driven B2C flow with pre-checkout Stripe Tax estimation, category-based tax code resolution, and route/webhook separation so the payment page no longer depends on a client fetch-only checkout start or a tax-blind summary.
2026-04-17 | **Stripe Checkout Markets, Tax & Currency Base** | **FIXED MISTAKE**: Replaced the old Payment Intents checkout path with Stripe Checkout Sessions plus webhook tracking, introduced rule-based locale→market→currency resolution for future languages, and moved tax collection to Stripe automatic tax instead of keeping currency and tax logic hardcoded in the payment page.
2026-04-17 | **Admin Chart Stable Container Guard** | **FIXED MISTAKE**: Added a measured chart wrapper so Recharts mounts only after chart containers have real dimensions, avoiding the recurring negative width/height warnings caused by rendering inside flex/grid layouts before sizing completed.
2026-04-17 | **Featured Products Background Adjustment** | **FIXED MISTAKE**: Changed the Featured Products section background to white on the home page after the user expressed dissatisfaction with the grey background.
2026-04-17 | **Global Build, Lint & Git Push** | **FIXED MISTAKE**: Consolidated the admin notification improvements, policy page premium redesign, and profile/product save hardening into a verified production-ready state with zero build/lint failures.
2026-04-17 | **Admin Notifications CRM Refresh** | **FIXED MISTAKE**: Rebuilt the admin notification center so it routes correctly, listens to order and CRM activity (tickets, refunds, customer signups, reviews), and persists a real “clear old data” cutoff instead of repopulating stale alerts on every mount.
2026-04-17 | **Policy Layout Simplification Pass** | **FIXED MISTAKE**: Removed the semi-dashboard feel from policy pages and reduced the layout to a cleaner single-document border design after over-styling the pages beyond the user's preference for simple policy screens.
2026-04-17 | **Policy Pages Settings-First Rendering** | **FIXED MISTAKE**: Changed policy rendering to prefer storefront settings content over stale `pages` rows so edits from `Storefront Settings` become the true source of truth while preserving the border-only policy layout.
2026-04-17 | **Server-Safe Policy Defaults** | **FIXED MISTAKE**: Removed policy-page fallback dependence on the client-only settings store and moved default policy content into a server-safe module so `/p/privacy-policy` cannot fail because of a `use client` import boundary.
2026-04-17 | **Policy Redirect Loop Removal** | **FIXED MISTAKE**: Replaced the two-way policy redirects with shared direct rendering so `/privacy-policy` and `/p/privacy-policy` (plus the cookie/terms equivalents) no longer bounce between each other in an infinite loop.
2026-04-17 | **Explicit Legacy Policy Route Support** | **FIXED MISTAKE**: Added concrete `/p/privacy-policy`, `/p/cookie-policy`, and `/p/terms-of-service` routes so legacy policy URLs cannot fall through to a dev-time dynamic route miss or stale route cache.
2026-04-17 | **Policy Default Fallback Hardening** | **FIXED MISTAKE**: Prevented `/p/privacy-policy` from 404ing when both the `pages` row and saved storefront policy fields are missing by merging runtime policy fallback with project `defaultSettings`.
2026-04-17 | **Policy Route Aliases & Visual Restraint Pass** | **FIXED MISTAKE**: Added explicit `/privacy-policy`, `/cookie-policy`, and `/terms-of-service` aliases so policy pages open even when users bypass `/p/...`, and refined the policy layout to feel more aligned with the customer panel instead of overly decorative.
2026-04-17 | **Policy Page Fallback & Premium Redesign** | **FIXED MISTAKE**: Stopped `/p/privacy-policy` from disappearing when the `pages` row is missing by falling back to storefront policy settings, and redesigned policy pages with a richer premium layout instead of the plain markdown card.
2026-04-17 | **Address/Product Save Reliability & Cookie Banner Deferral** | **FIXED MISTAKE**: Reworked profile address writes to prefer privileged server writes when available while preserving session fallback, enforced authenticated admin checks on product save actions, and deferred cookie-banner mount plus removed its settings-store dependency so consent UI stops dragging storefront performance.
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
2026-04-16 | **Global Build, Lint & Git Push**           | **FIXED MISTAKE**: Consolidated all uncommitted security hardening, CRM repairs, and admin optimizations into a single verified state, ensuring the remote repository matches the local production-ready build with zero build/lint failures.
2026-04-18 | **CSP Realtime & Notification Query Cleanup** | **FIXED MISTAKE**: Allowed Supabase Realtime websockets and Vercel analytics script in CSP, disabled dev-only analytics injection, and removed a brittle `shipping_details` select from admin notifications that caused 400s on schemas not yet fully synced.

---

## 💡 LEARNINGS & RULES (PERMANENT)

> [!TIP]
> **Zero Repeat Rule**: I must always fix one mistake in every task and never repeat it. Every error is a lesson documented here.

> [!TIP]
> **Persistence Standard**: Always use Server Actions for Admin writes. The browser SDK should be reserved for public `SELECT` queries only to ensure RLS compliance and backend validation.

> [!TIP]
> **Aesthetics Rule**: Modern web design (flat design, rounded 4px, high-contrast typography) is NOT optional. The USER should be wowed by the UI.
