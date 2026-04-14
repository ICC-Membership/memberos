# ICC Membership OS — Project Memory & Transfer Document

> This document is the complete knowledge transfer package for the Industrial Cigar Company Membership OS. Paste the contents of this file into the **Project Instructions** of the new Manus account so the incoming agent has full context to continue development without gaps.

---

## 1. Business Context

**Company:** Industrial Cigar Company (ICC)  
**Owner:** Andrew Frakes  
**Email:** andrew@industrialcigars.com  
**Location:** Private membership cigar lounge  
**Goal:** Reach 200 active members. As of April 2026, the lounge is at approximately 134 active members.

The OS is Andrew's internal command center — it replaces spreadsheets and manual processes for member management, locker assignments, staff commission tracking, prospect targeting, and quarterly APEX lounge invitations. Andrew works from home most days with two evening shifts per week at the lounge. He wants the system to be as hands-off as possible so he can focus on member interaction and strategy rather than administration.

**Important language preferences:**
- Do NOT use the term "founding 200" — Andrew dislikes it. Refer to the goal as "200-member milestone."
- Do NOT explicitly mention AI in member-facing materials or initiatives.
- "Rocks" in this context means EOS (Entrepreneurial Operating System) 90-day strategic priorities, not short tasks.

---

## 2. Membership Tiers

The lounge has three membership tiers, managed via Appstle subscriptions on Shopify:

| Tier | Description | APEX Eligible? |
|---|---|---|
| **Visionary** | Entry-level membership | No |
| **Atabey** | Mid-tier, primary APEX candidate pool | Yes (if score ≥ 70) |
| **APEX** | Top-tier, private lounge access | Already in APEX |

APEX invitations are sent **quarterly**. Only Atabey members who score 70+ on the Power Score are eligible candidates.

---

## 3. APEX Power Rankings Algorithm

The Power Score is computed server-side via `trpc.scores.compute`. The **intended** algorithm (pending full Lightspeed integration) is:

| Category | Max Points | Calculation | Data Source |
|---|---|---|---|
| **Visit Frequency** | 35 pts | Monthly lounge visits (auto from Lightspeed POS) | Lightspeed |
| **Spend per Visit** | 25 pts | Average F&B + retail spend per visit | Lightspeed |
| **Referrals** | 20 pts | Active member referrals brought in | Manual entry |
| **Tenure** | 10 pts | 1 pt per month as member, max 10 months | Appstle join date |
| **Event Attendance** | 10 pts | Events attended (2 pts each, max 5) | Manual entry |

**APEX threshold: 70+ points.** The tier bonus (Visionary=10, Atabey=20, APEX=30) that was in the original code is **wrong and should be removed** — it creates circular scoring. The score should measure behavior only.

Andrew has a Power Scorer Google Sheet at:  
`https://docs.google.com/spreadsheets/d/11z5wBH02SQomg_6rVMMg5RFyOtshmn5kgWlzwgA7yEE/edit`  
This sheet contains his own scoring model. **Read this sheet first** before finalizing the algorithm — the agent was unable to access it due to a Google account mismatch. Connect the ICC Google account (`andrew@industrialcigars.com`) and read this sheet to align the algorithm with Andrew's intent.

---

## 4. APEX Locker Bank — Physical Layout

The APEX locker bank has a specific physical layout that must be reflected in the Locker Diagram page. This is not a generic grid:

- **4 Corner Enterprise Lockers** (C1, C2, C3, C4): Located at the four corners of the bank. Each holds **3 individuals**. Rendered as wider cells spanning 3 columns.
- **Top Row Corporate Lockers** (#1–#10): Holds **2 individuals** each (some special cases). Rendered as slightly wider cells.
- **Locker #37 — Eliot Hamerman**: A single oversized locker physically the size of **4 standard lockers**. Rendered spanning 4 columns in the center of the bank.
- **All other lockers**: Individual (1 person each).

**Color coding:**
- Green glow = Available (no current occupant)
- Red highlight = Payment overdue
- Default bank color = Occupied and current

**Each locker cell displays:** Nameplate label + Key code  
**Popup shows:** Phone, email, birthdate, key number, notes (Lightspeed notes auto-populate when connected)

---

## 5. Prospect Scoring Rules

Prospects are auto-imported from Lightspeed POS. The threshold is:
- **3+ visits in the last 30 days AND $50+ average spend per visit** (both conditions must be true)

Composite score formula:
- **60% weight** — visit frequency rank (relative to all qualifying non-members)
- **40% weight** — spend-per-visit rank (relative to all qualifying non-members)

Score range: 0–100. Hot = 70+, Warm = 45–69, Cold = below 45.

Prospects also come in via **Typeform inquiry form** (source tag = "Typeform"). The Typeform form ID needs to be provided by Andrew to activate the webhook auto-create.

---

## 6. Integrations Status

| Integration | Status | Notes |
|---|---|---|
| **Appstle** | Connected (API key set) | Member sync, subscription tiers, dunning status |
| **Lightspeed POS** | OAuth ready, not yet authorized | Needs live domain for OAuth redirect. Authorize at `/api/lightspeed/connect` |
| **Shopify** | Credentials set | `industrialcigars.co` store domain |
| **Typeform** | Webhook endpoint built | Needs Typeform form ID from Andrew |
| **Ninety.io** | No API/webhook available | Rocks sync not possible yet; n8n webhook pre-built for when they add it |
| **Google Sheets** | Read via rclone (different account) | ICC Google account (`andrew@industrialcigars.com`) needs to be connected for locker sync |
| **Gmail** | MCP configured | Email Hub real sync pending — needs `andrew@industrialcigars.com` authorized |
| **n8n** | 4 workflow JSONs exported | Morning briefing, Typeform→prospect, payment failure, win-back refresh |

**Critical next step:** Publish the site to the live domain so Lightspeed OAuth can complete. The redirect URL must be a public domain — the OAuth flow will not work on localhost.

---

## 7. Environment Variables Required

All secrets are managed via Manus project secrets (never hardcode):

| Variable | Purpose |
|---|---|
| `APPSTLE_API_KEY` | Appstle subscription management API |
| `LIGHTSPEED_CLIENT_ID` | Lightspeed OAuth client ID |
| `LIGHTSPEED_CLIENT_SECRET` | Lightspeed OAuth client secret |
| `SHOPIFY_STORE_DOMAIN` | `industrialcigars.co` |
| `SHOPIFY_CLIENT_ID` | Shopify app client ID |
| `SHOPIFY_CLIENT_SECRET` | Shopify app client secret |
| `MORNING_BRIEFING_TOKEN` | Bearer token for n8n morning briefing webhook |
| `NINETY_WEBHOOK_SECRET` | HMAC secret for Ninety.io webhook (future) |
| `DATABASE_URL` | MySQL/TiDB connection string (auto-injected by Manus) |
| `JWT_SECRET` | Session cookie signing (auto-injected) |
| `VITE_APP_ID` | Manus OAuth app ID (auto-injected) |
| `OAUTH_SERVER_URL` | Manus OAuth backend (auto-injected) |
| `BUILT_IN_FORGE_API_URL` | Manus LLM/storage API (auto-injected) |
| `BUILT_IN_FORGE_API_KEY` | Manus LLM/storage bearer token (auto-injected) |

---

## 8. Database Tables

The schema is in `drizzle/schema.ts`. All tables use MySQL via Drizzle ORM:

| Table | Purpose |
|---|---|
| `users` | Manus OAuth users (staff who log in) |
| `members` | All ICC members — synced from Appstle. Includes tier, status, scores, locker assignment |
| `rocks` | EOS 90-day Rocks with owner, quarter, progress % |
| `meetingNotes` | L10 meeting notes with action items |
| `emailCache` | Cached emails from Gmail/Email Hub |
| `emailDraftQueue` | AI-drafted emails queued for review before sending |
| `prospects` | Non-member prospects with scoring, source, status, staff assignment |
| `integrationTokens` | OAuth tokens for Lightspeed and other services |
| `staff` | ICC staff members for commission tracking and tour logging |
| `tourLogs` | Tour records linking staff → prospect → outcome |
| `lockers` | All 207+ lockers with nameplate, key code, occupant, type, payment status |
| `lockerHistory` | Timestamped log of every locker assignment change |
| `memberNotes` | Notes attached to member profiles |
| `deals` | Lit-Ventures deal pipeline (Intake → Diligence → Term Sheet → Closed/Passed) |
| `systemErrors` | Error log for failed syncs, webhook errors, integration failures |

---

## 9. Navigation Structure (Sidebar)

The sidebar is defined in `client/src/components/DashboardLayout.tsx`. Current nav items:

| Label | Route | Purpose |
|---|---|---|
| Command Center | `/` | Main dashboard — KPIs, 200-member countdown, renewals, PDF morning report |
| Members | `/members` | Full member list with bulk actions, CSV export |
| Member 360 | `/member360` | Individual member profile — payment history, notes, locker, APEX eligibility |
| Prospects | `/prospects` | Auto-scored non-member targeting list for staff |
| APEX Power Rankings | `/power-rankings` | Leaderboard + quarterly APEX invite workflow |
| Win-Back Queue | `/win-back` | Cancelled/paused members with AI re-engagement drafts |
| Locker Diagram | `/lockers` | Visual locker bank with assign/reassign/history |
| Email Hub | `/email` | Inbox + draft queue (Gmail sync pending) |
| EOS Rocks | `/rocks` | 90-day strategic priorities with progress tracking |
| L10 Notes | `/meeting-notes` | L10 meeting notes with action items → Rock creation |
| Growth Engine | `/growth-engine` | Referral tracking, QR codes (QR per staff member pending) |
| Strategy | `/strategy` | 200-member countdown, weekly net adds trend |
| Commission | `/commission` | Staff payout calculator, quarterly bonus pool |
| Training | `/training` | Staff training materials |
| System Monitor | `/system-monitor` | Error log, integration health, n8n workflow exports |

**Hidden from nav (accessible via direct URL):**
- `/lit-ventures` — Deal pipeline Kanban board (Andrew asked to hide from sidebar)

---

## 10. Design System

The app uses a dark, premium aesthetic inspired by a private cigar lounge:

- **Background:** `#080808` (near-black)
- **Surface:** `#1A1614` (dark warm brown)
- **Primary Red:** `#C8102E` (ICC brand red)
- **Gold accent:** `#C4A35A`
- **Text primary:** `#F5F0EB` (warm off-white)
- **Text muted:** `#6B6560`
- **Font:** Bebas Neue (headings) + Inter (body)
- **Theme:** Dark mode only (`defaultTheme="dark"`)

All pages use `DashboardLayout` from `client/src/components/DashboardLayout.tsx`. Do not add a second header inside pages — the layout already provides the top bar.

---

## 11. Key Design Decisions & Preferences

- **No tier bonus in Power Score** — scoring should reflect behavior, not what tier a member already paid for.
- **Lit-Ventures hidden from nav** — Andrew wants it accessible but not prominent. Keep it at `/lit-ventures`.
- **No "founding 200" language** anywhere in the UI.
- **No explicit AI mentions** in member-facing copy or emails.
- **Rocks = 90-day EOS priorities** — not short tasks. The L10 Notes page has a "→ Rock" button on each action item that creates a properly scoped Rock.
- **Locker diagram is the source of truth** — changes made in the OS should eventually sync back to the Google Sheet, not the other way around.
- **Prospect threshold is strict** — BOTH 3+ visits/month AND $50+ avg spend per visit must be true. Not either/or.
- **APEX invitations are quarterly** — the invite workflow drafts a personalized email via LLM and queues it in Email Hub for Andrew to review before sending.
- **Commission tracking** uses a Google Sheet as the source for tour logs (`ICC Membership Sales Tracker 2026 (ICC Master).xlsx` in Google Drive).

---

## 12. Pending / Next Steps

These items are known to be incomplete and should be prioritized in the new account:

1. **Read Andrew's Power Scorer Google Sheet** — connect `andrew@industrialcigars.com` Google account and read `https://docs.google.com/spreadsheets/d/11z5wBH02SQomg_6rVMMg5RFyOtshmn5kgWlzwgA7yEE/edit` to align the scoring algorithm exactly with Andrew's model.
2. **Publish the site** — required before Lightspeed OAuth can complete. Use the Manus Publish button.
3. **Authorize Lightspeed OAuth** — after publishing, go to `/api/lightspeed/connect` to complete the OAuth flow and enable real member visit/spend data.
4. **Wire Typeform → Prospects** — Andrew will provide the Typeform form ID. Add it as a secret (`TYPEFORM_FORM_ID`) and activate the webhook.
5. **Google Sheets ↔ Locker Diagram two-way sync** — connect the ICC Google account via MCP and wire the locker diagram to read/write the V3 locker sheet automatically.
6. **Gmail sync in Email Hub** — authorize `andrew@industrialcigars.com` via Gmail MCP to pull the last 50 emails into the Email Hub inbox tab.
7. **Growth Engine QR codes** — add a printable/shareable QR code card per staff member for tour sign-up attribution.
8. **Role-based access control** — Commission, Strategy, and Lit-Ventures pages should be admin-only. Use `ctx.user.role === 'admin'` gate.
9. **Rebuild Power Score algorithm** — remove tier bonus, implement the 5-category behavioral model, align with Andrew's Google Sheet.
10. **Locker popup Lightspeed auto-populate** — once OAuth is authorized, pull phone/email/birthdate/account notes from Lightspeed customer records into the locker popup.

---

## 13. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Express 4, tRPC 11 |
| Database | MySQL (TiDB) via Drizzle ORM |
| Auth | Manus OAuth (session cookies) |
| File storage | S3 via `storagePut`/`storageGet` helpers |
| LLM | Manus built-in LLM via `invokeLLM` |
| Build | Vite + esbuild |
| Tests | Vitest (48 tests passing) |

---

## 14. GitHub Repository

**Code:** https://github.com/ICC-Membership/memberos  
**Branch:** `main`  
**To deploy in new Manus account:**
1. Connect GitHub in Manus Settings → GitHub
2. Import `ICC-Membership/memberos`
3. Add all secrets listed in Section 7
4. Run `pnpm db:push` to apply the schema
5. Click Publish

---

*Document generated April 14, 2026. All information reflects the state of the project at checkpoint `2f47a524`.*
