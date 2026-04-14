# ICC Membership OS — Todo

## Completed
- [x] Initial OS build with 8 pages (Dashboard, Members, Power Rankings, Locker Diagram, Email Hub, Strategy, Training, Growth Engine)
- [x] ICC brand identity applied (C8102E red, Bebas Neue, near-black)
- [x] Wave 2 Brain Trust session (AI Expert, Operator Mindset, Systems Thinking, Growth Engineering)
- [x] Full-stack upgrade (web-db-user) — backend, database, tRPC, auth

## Wave 3: Live Integrations — Completed

- [x] Gmail integration — Email Hub with AI reply via LLM (demo mode + sync-ready)
- [x] EOS Rocks page — full CRUD with progress tracking and Ninety.io links
- [x] Otter.ai L10 meeting notes — file upload + AI parser for membership mentions + action items
- [x] Database schema — members, rocks, emails, meetingNotes, prospects tables
- [x] Prospect Pipeline page — kanban status tracking from inquiry to close
- [x] Sidebar navigation updated (Prospects, EOS Rocks, L10 Notes)
- [x] TypeScript clean (0 errors), tests passing

## In Progress / Next
- [x] Morning Briefing — scheduled daily 8 AM summary email
- [x] Typeform webhook — auto-populate prospects from inquiry form
- [ ] Appstle/Shopify live member sync via API
- [x] Lightspeed R-Series OAuth integration — routes, token storage, DB schema
- [ ] Lightspeed OAuth authorization — complete connect flow via published domain
- [ ] Lightspeed data sync — customers, sales, visit frequency per member
- [ ] Full site audit — identify all hardcoded vs. live data
- [ ] Dashboard — wire all KPIs to live Appstle data (member count, MRR, failed payments)
- [ ] Members page — live sync from Appstle with status, tier, rate, paused/failed flags
- [ ] Power Rankings — auto-score from real visit/spend/tenure/referral data
- [ ] Missed payment automation — Appstle webhook → auto email sequence
- [ ] Prospect identification from Lightspeed POS — frequent visitors not yet members
- [x] Locker Diagram — populate from real member locker assignments (3 banks: APEX, Atabey, Visionary)
- [ ] Strategy page — wire to live member growth metrics

## Backlog
- [ ] Typeform inquiry feed in Email Hub
- [ ] Lightspeed POS spend data per member
- [ ] Toast F&B spend per member
- [ ] Power Rankings auto-scoring from real data
- [ ] Locker Diagram populated with real member assignments
- [ ] Commission plan tracker for staff

## Overnight Build Queue (Wave 1-15)
- [x] Wave 1: Payment failure auto-email on Attempt 1
- [x] Wave 1: Payment failure draft email on Attempt 3 (Gmail draft)
- [x] Wave 1: Attempt 5-6 push notification with member phone number
- [x] Wave 1b: New member welcome email automation
- [x] Wave 2: Dashboard — full live data wiring (KPIs, tier breakdown, renewals)
- [x] Wave 2: Members page — dunning flags, paused duration, sync button live
- [x] Wave 2: Power Rankings — real scores from DB
- [x] Wave 2b: Locker Diagram — wire to real member assignments from DB
- [x] Wave 11: APEX quarterly review scaffold — auto-rank Atabey by Power Score
- [x] Wave 12: Win-back draft queue — HIGH priority cancelled members auto-drafted weekly
- [x] Wave 15: Lit-Ventures deal intake form + AI deal memo template

## New Features Requested
- [x] Member 360 Profile page — full view per member: tier, locker, visit history, spend, scores, notes, payment status
- [ ] SALTO door access integration — track member entries/exits, visit frequency, last seen date
- [ ] Toast POS integration — cross-reference bar/restaurant spend by phone number to member profile
- [x] Staff Commission Tracker — track referrals, commissions earned, payout history per staff member
- [ ] Remind user to answer 4 open questions: locker layout, commission plan, ICC email address, publish site for Lightspeed

## Commission Structure (from training deck)
### Quarterly Bonus Pool
- Add 20 members/qtr: 1st $750, 2nd $375, 3rd $150
- Add 30 members/qtr: 1st $1,000, 2nd $500, 3rd $150

### End of Year Bonus Pool
- 200-215 members: 1st $5,000, 2nd $2,000, 3rd $350
- 216-230 members: 1st $7,500, 2nd $3,500, 3rd $700
- 231-255 members: 1st $10,000, 2nd $5,000, 3rd $1,200

### Tracking
- Each staff member has a personalized QR code
- Sign-ups through QR code = initiation fee waived
- Leaderboard updated weekly
- Tours must be logged with Andrew

## Email Config
- ICC sending address: andrew@industrialcigars.com
- Members contact: members@industrialcigars.com

## Overnight Build — Wave 6 (Apr 13 overnight) — ALL COMPLETE
- [x] Strategy page — wire member growth chart, MRR trend, tier breakdown to live Appstle data
- [x] Growth Engine page — connect referral leaderboard, QR code performance, funnel metrics to real DB
- [x] Lit-Ventures deal intake form with AI-generated investment memo output
- [x] Typeform inquiry feed in Email Hub inbox tab (Draft Queue tab added)
- [x] Commission Tracker — wire tour log table to real Google Sheet data (staff seeded, 0 tours logged yet)
- [x] Member 360 — show actual locker number from V3 sheet data on profile (207 lockers seeded)
- [x] Power Rankings — live scoring engine (807 members scored: APEX avg 43.7, Atabey 30.6, Visionary 24.7)
- [x] Win-Back Queue — AI Draft button queues personalized re-engagement email via LLM
- [x] APEX Review — one-click Draft Invite button queuing personalized APEX invitation email
- [x] Vitest coverage for all new procedures (22 tests passing: scores, win-back, lockers, webhooks, commission)

## Wave 7 — Full Overnight Build (Apr 13-14 night)

### Tier 1 — High Impact
- [x] n8n workflow JSON exports (morning briefing, Typeform→prospect, payment failure, win-back refresh)
- [x] Prospect Pipeline — auto-score, Book Tour button, Convert to Member button
- [x] Member 360 — Send Note button, full payment history, dunning status, APEX eligibility
- [x] Commission Tracker — live payout calculator with quarterly bonus pool math
- [x] Locker Diagram — move/reassign flow with timestamp logging
- [x] Strategy page — 200-member countdown with projected date and weekly net adds trend

### Tier 2 — Operational Depth
- [ ] Email Hub — real Gmail sync via MCP (last 50 emails from andrew@industrialcigars.com)
- [x] L10 Notes — auto-create EOS Rocks from AI-parsed action items
- [x] Lit-Ventures — deal pipeline Kanban board (Intake → Due Diligence → Term Sheet → Closed/Passed)
- [ ] Growth Engine — referral QR code page per staff member (printable/shareable)
- [x] Dashboard — Export Morning Report as PDF
- [x] Members page — bulk actions (select multiple, queue email, pause notice)

### Tier 3 — Polish and Infrastructure
- [x] Mobile responsiveness audit and fixes across all pages
- [ ] Role-based access control (admin-only pages: Commission, Lit-Ventures, Strategy)
- [ ] GitHub export to private repo (requires gh auth login)
- [x] Error monitoring page (failed syncs, email queue failures, webhook errors)

### Tier 4 — Additional Improvements (discovered during build)
- [ ] Member notes system — add/edit/view notes on any member from Member 360
- [ ] Prospect → Member conversion flow — one-click upgrade from Prospect Pipeline
- [ ] Staff performance dashboard — tours given, conversion rate, commission YTD per staff
- [ ] Renewal alert system — push notification when member renewal is within 3 days
- [ ] Locker waitlist — track members waiting for a specific locker section
- [ ] Member birthday tracker — flag upcoming birthdays on the dashboard
- [ ] Bottle Concierge row management — separate view for row 6 Atabey assignments
- [ ] Search across all pages — global search bar for members, prospects, lockers

## User Feedback — Apr 14 (Power Rankings + Locker Diagram Overhaul)
- [x] Merge Power Rankings + APEX Review into one unified page (remove duplicate nav item)
- [x] Rebuild APEX locker bank with correct physical layout (4 corner enterprise, top row corporate, Eliot 4x locker, individual)
- [x] Add nameplate name + key code to every locker cell in all banks
- [x] Add payment status color coding: available = green highlight, payment overdue = red highlight
- [x] Enrich locker popup: phone, email, birthdate, key number, notes (Lightspeed notes when connected)
- [x] Clarify Google Sheet sync process in the UI (explain bidirectional sync status)
- [x] Make locker diagram bigger and easier to read (larger cells, larger text)
- [ ] Google Sheet ↔ Locker Diagram two-way auto-sync (requires Google Sheets MCP integration)
- [ ] Lightspeed → locker popup auto-populate phone/email/birthdate/notes

## User Feedback — Apr 14 (Lit-Ventures + Prospects Overhaul)
- [x] Remove Lit-Ventures from sidebar nav (keep page at /lit-ventures for direct access)
- [x] Rebuild Prospects page: auto-populate from Lightspeed spend/frequency + Typeform inquiries
- [x] Prospect scoring: Lightspeed visit frequency + spend threshold = auto-score
- [x] Staff targeting view: show top prospects with "Assign to Staff" for follow-up
- [x] Typeform inquiry → auto-create prospect with source tag
- [x] Lightspeed non-member frequent visitor → auto-create prospect with visit/spend data
- [x] Prospect status pipeline: New → Contacted → Tour Scheduled → Converted / Not Interested
- [ ] n8n webhook endpoint for Ninety.io Rocks sync (pre-built, ready when Ninety adds Zapier trigger)

## User Feedback — Apr 14 (Prospect Scoring Thresholds)
- [ ] Import threshold: 3+ visits/month AND $50+ avg spend per visit (from Lightspeed)
- [ ] Composite prospect score: 60% visit frequency rank + 40% spend-per-visit rank
- [ ] Ranked list view: sort by composite score descending, show visits/mo, spend/visit, contact info
- [ ] Contact info visible on prospect card: name, phone, email, last visit date

## User Feedback — Apr 14 (Typography Readability)
- [x] Improve global font readability: larger body text, better line height, cleaner body font
- [x] Increase contrast on muted text (labels, secondary info) for easier scanning
- [x] Ensure headings use Bebas Neue at readable sizes, body uses Inter at 15-16px base
- [x] Improve table row readability: larger text, better row spacing
