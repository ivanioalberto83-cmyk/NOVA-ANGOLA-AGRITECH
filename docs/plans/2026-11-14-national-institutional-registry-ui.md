# National Institutional Registry UI — Implementation Plan

**Goal:** expose the existing institutional records in a national-governance view without claiming that the complete state registry or its write workflows already exist.

**Architecture:** keep the current authenticated governance Edge Function as the read source. Add a pure presentation module that renders the existing `emergency_institutions` records, integrate it into the governance panel, and clearly disclose the scope and validation state of those records. No database schema, RLS, Edge Function, secret, or production data is changed in this delivery.

**Tech Stack:** Vite, vanilla JavaScript ES modules, CSS, Supabase authenticated Edge Function, Vercel Git deployments.

## Global Constraints

- Preserve existing institutional and territorial records.
- Do not fabricate ministries, public companies, regulators, concessionaires, contacts, or approvals.
- Do not present `proposed` records as verified or officially approved.
- Keep the Security and Defence operational data behind existing authorization checks.
- Do not execute Supabase migrations or change RLS, functions, keys, or project settings.
- Use a separate feature branch and a Vercel preview deployment for review.

---

### Task 1: Add the read-only institutional registry presentation

**Files:**
- Create: `src/institution-registry.js`
- Modify: `src/governance.js`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `institutions[]` returned by `agritech-governance-dashboard`, with `id`, `code`, `name`, `type`, `jurisdiction`, `integration_status`, `agreement_reference`.
- Produces: `renderInstitutionRegistry(institutions)`, an escaped HTML view with totals, category counts, state labels, and an explicit scope notice.

- [x] Add a pure rendering module.
- [x] Replace the existing institutional table section with the registry component.
- [x] Add responsive styles and distinct status treatments.
- [ ] Verify the Vite production build and inspect the preview deployment.

### Task 2: Remove pilot-only framing from national platform labels

**Files:**
- Modify: `src/main.js`

**Interfaces:**
- Consumes: existing pilot-derived satellite and geography data without changing its schema.
- Produces: national platform wording while retaining Malanje as a clearly labelled reference area.

- [x] Update login and dashboard descriptions.
- [x] Retain the historical Malanje cassava reference without presenting it as the platform's geographic limit.
- [ ] Verify the rendered preview and ensure no pilot-only wording remains in user-facing copy.

### Task 3: Preview deployment and review gate

**Files:**
- No additional source files.

**Interfaces:**
- Consumes: feature branch commit from GitHub.
- Produces: Vercel preview URL and deployment status.

- [ ] Confirm the preview uses the intended repository, branch, and commit.
- [ ] Confirm build status is READY.
- [ ] Review the institutional registry, mobile layout, authentication, and existing emergency sections.
- [ ] Do not promote to production until the preview is reviewed and the production target is confirmed.

## Explicitly out of scope

The central `institutions` table, institutional hierarchy, departments, units, mandates, new assignment rules, RLS changes, and CRUD/homologation workflows require a separate schema and security implementation. They are not implied by this UI-only delivery.
