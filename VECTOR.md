---
# VECTOR.md — Project Doctrine
# This file is the single source of truth for project intent, audience, and knowledge.
# Read this before CLAUDE.md. Read CLAUDE.md before writing code.

vector_version: "0.1"

project:
  name: "Yard Shift"
  description: "A mobile-first web app that helps people and their families catalog, price, and run yard sales together."
  stage: "discovery"
  started: "2026-03-11"
  repo: "https://github.com/amkhz/yard-shift"

owner:
  name: "Justin Hernandez"
  role: "Product designer and project director"

knowledge:
  research: "./vector/research/"
  schemas: "./vector/schemas/"
  decisions: "./vector/decisions/"
---

# Identity

## Problem Statement

Running a yard sale is a full-day coordination problem disguised as a simple event. Hosts dread cataloging their items, they spend hours pricing items from memory, lose track of what sold and for how much, and have no way to let family helpers ring things up without constant check-ins. The tools people use today are sticky notes, notes apps on their phone, cash boxes, and group texts — none of which give you a clear picture of how the sale is going while you're in the middle of it.

## Target Audience

The primary user is someone (and their family or friends) cleaning out the house and running a yard sale. They're not retail professionals — they're people who want to turn clutter into cash with as little friction as possible. They currently use handwritten price tags, their notes app on their phone, a cash box, and maybe a spreadsheet after the fact.

## Core Value Proposition

Yard Shift lets a host and their helpers run a sale together from their phones — so everyone knows what's for sale, what's sold, and how much money they've made, without shouting across the driveway.

## What This Is Not

- **Not a marketplace.** Shoppers don't browse listings online. They show up in person.
- **Not a payment processor.** The app doesn't handle money. Cash, Venmo, Zelle, Cash App — whatever the buyer and seller agree on.
- **Not a shipping or delivery service.**
- **Not a social network.**
- **Not an app store app (yet).** Mobile web first.

---

# Knowledge Map

## Research Status

| Artifact | Status | Location |
|----------|--------|----------|
| User Interviews | Not started | `./vector/research/interviews/` |
| Jobs to Be Done | Not started | `./vector/research/jtbd/` |
| Personas | Not started | `./vector/research/personas/` |
| Competitive Analysis | Not started | `./vector/research/competitive/` |
| Assumptions | Seeded | `./vector/research/assumptions/` |
| Prototype Review | Complete | `./vector/research/prototype-review.md` |

## Key Assumptions

1. **Hosts want a digital catalog, not just price stickers.** Having items in the app makes checkout faster and gives a record of what sold. *(hypothesis)*
2. **Family helpers will use the app if onboarding is one tap.** Magic link invites remove the friction of account creation. *(hypothesis)*
3. **Real-time sync matters on sale day.** If two helpers are checking people out, they need to see the same inventory state. *(hypothesis)*
4. **Photo upload is nice-to-have, not essential.** Many items won't get photographed — the app should work great without photos. *(hypothesis)*
5. **Shoppers should never need to download or use the app.** The entire buyer experience is physical — browse, pick, pay. *(hypothesis)*
6. **A solo designer with AI assistance can ship an MVP in 3 weeks** using a managed backend (Supabase) and a clean frontend scaffold. *(testing)*

## Open Questions

- What does the checkout flow actually look like? A helper taps "sold" — but how do they find the right item quickly? Search? Scan? Browse by category? This needs a design spike.
- How do unsold items get handled after a sale? Donate, relist for next time, toss? Is that in-scope for MVP or a fast-follow?
- Should the app generate printable price tags or QR codes for items? Could speed up checkout, but adds complexity.
- What's the right data model for "who contributed which items" if a sale has items from multiple family members? Is that MVP or later? Does it even matter?

---

# Architecture Doctrine

See ARCHITECTURE.md for technical implementation details.

This section captures the *why* behind technical decisions.

## Design Principles

1. **The host's phone is the command center.** Every feature should work great on a phone screen, one-handed, in bright sunlight. Desktop is a bonus for catalog setup the night before but can also be used for the whole process in a pinch.
2. **Invisible to shoppers.** The app is for the host and helpers. If a shopper has to interact with the app to buy something, we've failed.
3. **Effortless over powerful.** Fewer features done beautifully beats more features done adequately. If it takes more than two taps, simplify it.
4. **The architecture serves the product.** Four layers (design system, core, services, UI) keep things clean, but they exist to ship faster, not to be admired. Don't over-engineer.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | React 19 + Vite 6 | App, not a website. No SSR needed. Fast builds, simple mental model. Scaffold already set up. |
| **Backend + DB** | Supabase (Postgres) | One SDK for database, auth, storage, and real-time. Relational data model fits naturally. Free tier covers MVP and beyond. |
| **Auth** | Supabase Auth | Email + password for hosts. Magic link invites for helpers. Row-level security scopes data per sale. |
| **Photo Storage** | Supabase Storage | Direct browser upload. 1 GB free. Compress client-side before upload. |
| **Real-time** | Supabase Realtime | WebSocket sync between helpers on sale day. Respects RLS policies. ~15 lines of code. |
| **Hosting** | Cloudflare Pages | Unlimited bandwidth on free tier. 300+ edge locations. Connect repo and deploy. |
| **Styling** | CSS variables (tokens.css) | No Tailwind. No CSS-in-JS. Framework-agnostic. Theme switching via data attribute. |
| **Testing** | Vitest | Vite-native. Same config, same transforms. Tests live next to code. |

## Constraints

**Hard:**
- Budget: $0/month for infrastructure (free tiers only until launch)
- Team: one product designer (Justin) + AI assistant (Claude)
- Timeline: usable MVP within ~3 months (target: June 2026 for a real yard sale)
- Platform: mobile web, must work on iOS Safari and Android Chrome

**Soft:**
- Prefer managed services over self-hosted (Supabase over PocketBase)
- Prefer fewer dependencies over more (no library for what 20 lines of code can do)
- Prefer CSS variables over utility frameworks (established in ARCHITECTURE.md)
- Design quality matters — this should feel like Claude Desktop or Granola, not a hackathon project

---

# Quality Gates

## Definition of Done

A feature is done when:

- [ ] It works without errors on mobile Safari and Chrome
- [ ] Touch targets are at least 44px
- [ ] It follows the four-layer architecture (tokens, core, services, UI)
- [ ] No hardcoded colors, spacing, or font sizes outside `design-system/tokens.css`
- [ ] Core logic has tests
- [ ] It has been reviewed by Lookout (accessibility, performance, security)
- [ ] It's been committed with a clear message

## Ship Criteria

Before real users (Justin's family) use this at a yard sale:

- [ ] Host can create an account and log in
- [ ] Host can create a sale with date, time, and location
- [ ] Host can catalog items (name, price, category, optional photo)
- [ ] Host can invite helpers via link
- [ ] Helpers can join and see the sale's inventory
- [ ] Anyone on the sale can mark items as sold and record payment
- [ ] All helpers see real-time updates during the sale
- [ ] Host can see a summary of total sales and revenue
- [ ] Works reliably on a phone in a driveway with cell signal
- [ ] Feels delightful and effortless — not like a spreadsheet with buttons
