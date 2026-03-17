/*
 * Training — ICC Membership OS
 * Staff training materials: commission plan, sales script, onboarding guide
 * Based on actual ICC Google Drive documents
 */
import { useState } from "react";
import { BookOpen, Award, FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type Section = "commission" | "sales" | "onboarding" | "benefits";

const COMMISSION_TIERS = [
  { goal: "20 new members / quarter", first: "$750", second: "$375", third: "$150" },
  { goal: "30 new members / quarter", first: "$1,000", second: "$500", third: "$150" },
  { goal: "200–215 members (annual)", first: "$5,000", second: "$2,000", third: "$350" },
  { goal: "216–230 members (annual)", first: "$7,500", second: "$3,500", third: "$700" },
  { goal: "231–255 members (annual)", first: "$10,000", second: "$5,000", third: "$1,200" },
];

const SALES_STEPS = [
  {
    step: 1,
    title: "The Welcome",
    script: "Welcome to Industrial Cigar Company. My name is [Name] — have you been in before? [If no] Let me show you around — we have something pretty special here.",
    tip: "Make eye contact, smile, and slow down. First impressions set the tone for the entire membership conversation.",
  },
  {
    step: 2,
    title: "The Discovery",
    script: "What brings you in today? Are you a cigar enthusiast, or is this your first time exploring the world of premium cigars? [Listen actively — find their 'why']",
    tip: "The goal here is to understand what they value: community, exclusivity, business networking, relaxation, or the product itself.",
  },
  {
    step: 3,
    title: "The Tour",
    script: "Let me show you the lounge. This is our main floor — we have [describe current setup]. And back here is our APEX private lounge, which is exclusively for our top-tier members.",
    tip: "Always show the APEX lounge even to Visionary prospects. Aspiration sells upgrades.",
  },
  {
    step: 4,
    title: "The Presentation",
    script: "We have three membership tiers. Our Visionary membership is $49/month — full lounge access, member pricing, and invitations to our events. Our Atabey tier is $125/month and adds a dedicated locker and priority access. Our APEX membership at $215/month is our most exclusive — private lounge, concierge service, and all events.",
    tip: "Present all three tiers every time. Let them self-select. Never assume they can't afford APEX.",
  },
  {
    step: 5,
    title: "The Close",
    script: "Based on what you've told me, I think [tier] would be a great fit for you. We can get you set up today — it takes about 5 minutes. Which card would you like to use?",
    tip: "Ask for the sale directly. Hesitation here costs memberships. If they say 'let me think about it' — get their contact info and follow up within 24 hours.",
  },
];

const MEMBERSHIP_BENEFITS = [
  {
    benefit: "Lounge Access",
    visionary: "Full access during open hours",
    atabey: "Full access + priority seating",
    apex: "Full access + private APEX lounge",
  },
  {
    benefit: "Member Pricing",
    visionary: "10% off all cigars + F&B",
    atabey: "15% off all cigars + F&B",
    apex: "20% off all cigars + F&B",
  },
  {
    benefit: "Locker",
    visionary: "Available add-on",
    atabey: "Included",
    apex: "Premium locker included",
  },
  {
    benefit: "Events",
    visionary: "Member events",
    atabey: "All member events + priority",
    apex: "All events + APEX exclusive events",
  },
  {
    benefit: "Guests",
    visionary: "1 guest per visit",
    atabey: "2 guests per visit",
    apex: "4 guests + APEX guest access",
  },
  {
    benefit: "Monthly Dues",
    visionary: "$49/month",
    atabey: "$125/month",
    apex: "$215/month",
  },
  {
    benefit: "Initiation Fee",
    visionary: "$100",
    atabey: "$500",
    apex: "$1,000",
  },
];

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="icc-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color: "#C8102E" }} />
          <h2 className="text-sm font-semibold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
            {title}
          </h2>
        </div>
        {open ? <ChevronUp size={14} style={{ color: "#6B6560" }} /> : <ChevronDown size={14} style={{ color: "#6B6560" }} />}
      </button>
      {open && <div className="mt-4 gold-rule pt-4">{children}</div>}
    </div>
  );
}

export default function Training() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
            Training
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B6560" }}>
            Staff training materials, commission plan, and membership benefits
          </p>
        </div>
        <a
          href="https://drive.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-md border transition-all duration-180"
          style={{ color: "#C8102E", borderColor: "#C8102E", background: "#C8102E" }}
        >
          <ExternalLink size={12} />
          Google Drive
        </a>
      </div>

      {/* Commission Plan */}
      <CollapsibleSection title="2026 Commission & Referral Plan" icon={Award} defaultOpen={true}>
        <div className="space-y-4">
          <div className="p-3 rounded-lg" style={{ background: "#C8102E", border: "1px solid #C8102E" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#E8E4DC" }}>How It Works</p>
            <p className="text-xs leading-relaxed" style={{ color: "#A09A94" }}>
              Staff earn commissions by referring new members using their unique referral code, or by completing the full sales process (tour → present → close). Attribution is tracked by the Head of Membership. Commissions are paid at the end of each quarter. A 90-day clawback applies if a member cancels within 90 days of joining.
            </p>
          </div>

          <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#2A2A2A" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "#141414" }}>
                  <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Goal</th>
                  <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#E8E4DC" }}>1st Place</th>
                  <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#C4A35A" }}>Runner Up</th>
                  <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#8899CC" }}>3rd Place</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_TIERS.map((tier, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "#1E1E1E", background: i % 2 === 0 ? "#1C1C1C" : "#161616" }}>
                    <td className="px-4 py-3" style={{ color: "#A09A94" }}>{tier.goal}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: "#E8E4DC" }}>{tier.first}</td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: "#C4A35A" }}>{tier.second}</td>
                    <td className="px-4 py-3 text-center" style={{ color: "#8899CC" }}>{tier.third}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* Sales Script */}
      <CollapsibleSection title="Sales Script — 5-Step Membership Presentation" icon={FileText} defaultOpen={true}>
        <div className="space-y-3">
          {SALES_STEPS.map((step) => (
            <div key={step.step} className="p-4 rounded-lg" style={{ background: "#161616" }}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #C8102E, #E8E4DC)", color: "#161616" }}
                >
                  {step.step}
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>
                  {step.title}
                </span>
              </div>
              <div className="ml-8">
                <p className="text-xs italic mb-2 leading-relaxed" style={{ color: "#A09A94", borderLeft: "2px solid #C8102E", paddingLeft: "12px" }}>
                  "{step.script}"
                </p>
                <p className="text-xs" style={{ color: "#6B6560" }}>
                  <span style={{ color: "#C8102E" }}>Tip: </span>{step.tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Benefits Chart */}
      <CollapsibleSection title="Membership Benefits Comparison" icon={BookOpen} defaultOpen={false}>
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#2A2A2A" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#141414" }}>
                <th className="text-left px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#6B6560" }}>Benefit</th>
                <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#8899CC" }}>Visionary</th>
                <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#C4A35A" }}>Atabey</th>
                <th className="text-center px-4 py-3 font-medium tracking-wide uppercase" style={{ color: "#E8E4DC" }}>APEX</th>
              </tr>
            </thead>
            <tbody>
              {MEMBERSHIP_BENEFITS.map((b, i) => (
                <tr key={b.benefit} className="border-t" style={{ borderColor: "#1E1E1E", background: i % 2 === 0 ? "#1C1C1C" : "#161616" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "#A09A94" }}>{b.benefit}</td>
                  <td className="px-4 py-3 text-center" style={{ color: "#8899CC" }}>{b.visionary}</td>
                  <td className="px-4 py-3 text-center" style={{ color: "#C4A35A" }}>{b.atabey}</td>
                  <td className="px-4 py-3 text-center font-semibold" style={{ color: "#E8E4DC" }}>{b.apex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}
