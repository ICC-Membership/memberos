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
    title: "Identify the Signal",
    script: "[Internal] Look for: visits 3+ times/month, spends $100+ per visit, asks questions about the lounge or community, brings guests or talks about entertaining.",
    tip: "You are not a salesperson. You are a curator. Identify the right people, create the right moment, and make the invitation feel earned — not pushed.",
  },
  {
    step: 2,
    title: "The High-Spender Hook",
    script: "'Have you seen the back lounges yet? Let me show you something.' [Walk them to Atabey]",
    tip: "Lead with the experience, not the features. The Bottle Concierge is your most powerful closing tool for whiskey drinkers.",
  },
  {
    step: 3,
    title: "Sell the Network, Not the Room",
    script: "[Walk through Atabey] Don't just point at lockers — point out who is in the room. Sell the exclusivity and the caliber of people they will meet.",
    tip: "Stop talking when you walk them in. Let them feel it. Then say: 'This is what membership looks like.'",
  },
  {
    step: 4,
    title: "The Handoff",
    script: "'Let me introduce you to Andrew before you leave.' [Introduce to Drew or a key member in the lounge]",
    tip: "Let the community sell itself. A warm handoff to Drew or a respected member closes more deals than any pitch.",
  },
  {
    step: 5,
    title: "The Log & The Close",
    script: "'I'd like to personally invite you to become a member. I can walk you through it right now.' [Use your QR code card — initiation fee waived]",
    tip: "Log the tour with Andrew immediately. Present membership as an invitation to join the club, not a discount program. Ask for the sale directly.",
  },
];

const MEMBERSHIP_BENEFITS = [
  {
    benefit: "Lounge Access",
    visionary: "Dreamer Lounge",
    atabey: "Atabey Private Lounge",
    apex: "Full ICC Access",
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
    visionary: "Discounts & Events",
    atabey: "All member events",
    apex: "Complimentary Events",
  },
  {
    benefit: "Guests",
    visionary: "1 guest pass / quarter",
    atabey: "3 guest passes / month",
    apex: "Unlimited + APEX guest access",
  },
  {
    benefit: "Monthly Dues",
    visionary: "$59/month",
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

const OBJECTIONS = [
  { objection: "It's too expensive.", response: "You're not paying for cigars. You're paying for access, experience, and the people in it." },
  { objection: "I'll think about it.", response: "Take your time. Let me introduce you to Andrew before you leave." },
  { objection: "I'm not here enough.", response: "It's about having the right place when you do need it — for a client meeting or just to escape." },
  { objection: "I don't need a locker.", response: "The locker is just a perk. The real value is Atabey access and the community." },
];

const WEAPONS = [
  {
    name: "QR Code Card",
    description: "Each staff member has a personalized QR code. When someone signs up through your link, the initiation fee is automatically waived. That's your closing gift.",
    url: "https://industrialcigars.co/pages/membership-at-icc",
  },
  {
    name: "Bottle Concierge Menu",
    description: "Hand this to anyone ordering a premium pour. It shows the allocated bottles only available to Atabey and APEX members.",
    url: null,
  },
  {
    name: "The Verbal Invite",
    description: "'I'd like to personally invite you to become a member. I can walk you through it right now.'",
    url: null,
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

      {/* Objection Handling */}
      <CollapsibleSection title="Handling Objections Like a Pro" icon={FileText} defaultOpen={false}>
        <div className="space-y-3">
          {OBJECTIONS.map((o, i) => (
            <div key={i} className="p-4 rounded-lg flex gap-4" style={{ background: "#161616" }}>
              <div className="flex-shrink-0">
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: "#C8102E", lineHeight: 1 }}>0{i + 1}</span>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#6B6560" }}>THEY SAY: "{o.objection}"</p>
                <p className="text-xs leading-relaxed" style={{ color: "#E8E4DC", borderLeft: "2px solid #C4A35A", paddingLeft: "10px" }}>
                  "{o.response}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Your Weapons */}
      <CollapsibleSection title="Your Weapons" icon={Award} defaultOpen={false}>
        <div className="space-y-3">
          {WEAPONS.map((w, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: "#161616" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E8E4DC" }}>{w.name}</p>
                {w.url && (
                  <a href={w.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.65rem", color: "#C8102E" }}>
                    View ↗
                  </a>
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#A09A94" }}>{w.description}</p>
            </div>
          ))}
          <div className="p-3 rounded-lg" style={{ background: "#0A0A0A", border: "1px solid #2A2A2A" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#C4A35A" }}>Referral Activation</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6B6560" }}>
              Remind current Atabey and APEX members they can refer new members and earn free months of membership.
            </p>
            <a href="https://industrialcigars.co/blogs/news/member-referral-program" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.68rem", color: "#C8102E", display: "block", marginTop: "0.5rem" }}>
              industrialcigars.co/blogs/news/member-referral-program ↗
            </a>
          </div>
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
