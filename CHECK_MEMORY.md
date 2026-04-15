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
