/*
 * Email Hub — ICC Membership OS
 * Curated view of membership-relevant emails with AI reply drafting
 * Categories: New Inquiries, Renewals, Member Issues, Events
 */
import { useState } from "react";
import { Mail, Send, Sparkles, Tag, Clock, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type EmailCategory = "inquiry" | "renewal" | "issue" | "event" | "general";

interface Email {
  id: string;
  from: string;
  email: string;
  subject: string;
  preview: string;
  body: string;
  category: EmailCategory;
  time: string;
  read: boolean;
  priority: "high" | "medium" | "low";
}

const EMAILS: Email[] = [
  {
    id: "1",
    from: "Michael Torres",
    email: "mtorres@gmail.com",
    subject: "Interested in Membership — Friend Referral",
    preview: "Hi, my friend Jason Passwaters told me about your lounge and I'd love to learn more...",
    body: "Hi, my friend Jason Passwaters told me about your lounge and I'd love to learn more about membership options. I'm a cigar enthusiast and have been looking for a premium lounge experience in the Frisco area. Could you tell me more about the different membership tiers and what's included? I'm particularly interested in the private locker option. Best, Michael",
    category: "inquiry",
    time: "2h ago",
    read: false,
    priority: "high",
  },
  {
    id: "2",
    from: "Sandra Kim",
    email: "sandrakim@outlook.com",
    subject: "Membership Inquiry — Saw you on Instagram",
    preview: "Hello! I came across your lounge on Instagram and I'm very interested in becoming a member...",
    body: "Hello! I came across your lounge on Instagram and I'm very interested in becoming a member. I host a lot of business meetings and think a private cigar lounge membership would be perfect. What are the monthly dues and is there an initiation fee? Also, do you offer corporate memberships? Thank you, Sandra",
    category: "inquiry",
    time: "4h ago",
    read: false,
    priority: "high",
  },
  {
    id: "3",
    from: "Harold Bishop Jr.",
    email: "lsiu_tigers86@icloud.com",
    subject: "Question about my renewal",
    preview: "Hey Andrew, just wanted to confirm my renewal date and check if I can upgrade my locker...",
    body: "Hey Andrew, just wanted to confirm my renewal date is March 23rd and check if I can upgrade to a larger locker. Also, will the APEX event next quarter be on a weekend? I have a few colleagues I'd like to bring as guests. Thanks, Harold",
    category: "renewal",
    time: "Yesterday",
    read: true,
    priority: "medium",
  },
  {
    id: "4",
    from: "David Nguyen",
    email: "dnguyen@business.com",
    subject: "Corporate Membership — 3 Employees",
    preview: "We're looking to get memberships for 3 of our executives. Can you accommodate a group?",
    body: "Hi, I'm the office manager at Nguyen Capital Partners. We're looking to get memberships for 3 of our executives as a business perk. Can you accommodate a group sign-up? Is there any discount for multiple memberships? We'd be interested in the Atabey or APEX tier. Please let me know how to proceed. David Nguyen",
    category: "inquiry",
    time: "Yesterday",
    read: false,
    priority: "high",
  },
  {
    id: "5",
    from: "Caden Posey",
    email: "cadenposey11@gmail.com",
    subject: "Billing issue with my subscription",
    preview: "Hi, I noticed my card was charged twice this month. Can you look into this?",
    body: "Hi Andrew, I noticed my card was charged twice this month — once on Feb 21 and again on Feb 28. Can you look into this and process a refund if there was an error? My membership ID is #32340934976. Thanks, Caden",
    category: "issue",
    time: "2 days ago",
    read: false,
    priority: "high",
  },
  {
    id: "6",
    from: "Chris Williams",
    email: "ccprep2020@gmail.com",
    subject: "APEX Event — Can I bring a guest?",
    preview: "Hey, I heard about the APEX event next month. Am I eligible and can I bring a plus one?",
    body: "Hey Andrew, I heard about the APEX quarterly event coming up next month. I've been really active at the lounge lately and wanted to know if I'm eligible to attend. Also, is there a guest policy? I have a friend who's been thinking about joining and this would be a great way to introduce him. Thanks, Chris",
    category: "event",
    time: "3 days ago",
    read: true,
    priority: "medium",
  },
];

const CATEGORY_CONFIG: Record<EmailCategory, { label: string; color: string; bg: string }> = {
  inquiry: { label: "New Inquiry", color: "oklch(0.65 0.15 145)", bg: "oklch(0.35 0.10 145 / 0.20)" },
  renewal: { label: "Renewal", color: "oklch(0.72 0.12 75)", bg: "oklch(0.72 0.12 75 / 0.15)" },
  issue: { label: "Issue", color: "oklch(0.70 0.15 30)", bg: "oklch(0.55 0.15 25 / 0.20)" },
  event: { label: "Event", color: "oklch(0.65 0.10 55)", bg: "oklch(0.55 0.08 55 / 0.20)" },
  general: { label: "General", color: "oklch(0.60 0.010 70)", bg: "oklch(0.22 0.008 55)" },
};

const AI_TEMPLATES: Record<EmailCategory, (email: Email) => string> = {
  inquiry: (e) => `Hi ${e.from.split(" ")[0]},

Thank you for reaching out to Industrial Cigar Company — we're thrilled you're interested in joining our membership community!

We offer three membership tiers designed for different levels of engagement:

• **Visionary** — $49/month + $100 initiation. Access to our full lounge, events, and member pricing on all cigars and F&B.
• **Atabey** — $125/month + $500 initiation. All Visionary benefits plus priority seating, exclusive member events, and locker access.
• **APEX** — $215/month + $1,000 initiation. Our most exclusive tier — private lounge access, dedicated locker, all events, and concierge service.

I'd love to set up a quick tour of the lounge so you can experience it firsthand. We're located in Frisco, TX. Would you be available this week or next?

Looking forward to welcoming you,

Andrew Frakes
Head of Membership | Industrial Cigar Company`,

  renewal: (e) => `Hi ${e.from.split(" ")[0]},

Thanks for reaching out! I've confirmed your renewal date and I'm happy to help with your questions.

I'll follow up shortly with the specific details you asked about. If you need anything in the meantime, feel free to reply here or reach out directly.

Best,
Andrew Frakes
Head of Membership | Industrial Cigar Company`,

  issue: (e) => `Hi ${e.from.split(" ")[0]},

I'm sorry to hear about this — I'm looking into it right now and will get back to you within 24 hours with a resolution.

Thank you for bringing this to my attention, and I apologize for any inconvenience.

Best,
Andrew Frakes
Head of Membership | Industrial Cigar Company`,

  event: (e) => `Hi ${e.from.split(" ")[0]},

Great question! I'll check your current Power Rankings score and get back to you shortly with your eligibility status for the upcoming APEX event.

As for guests — APEX events do allow one guest per eligible member. I'll confirm all the details when I follow up.

Looking forward to seeing you there,

Andrew Frakes
Head of Membership | Industrial Cigar Company`,

  general: (e) => `Hi ${e.from.split(" ")[0]},

Thank you for reaching out to Industrial Cigar Company. I'll get back to you shortly.

Best,
Andrew Frakes
Head of Membership | Industrial Cigar Company`,
};

export default function EmailHub() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(EMAILS[0]);
  const [replyText, setReplyText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const filtered = categoryFilter === "All" ? EMAILS : EMAILS.filter(e => e.category === categoryFilter);
  const unread = EMAILS.filter(e => !e.read).length;

  const generateAIReply = () => {
    if (!selectedEmail) return;
    const template = AI_TEMPLATES[selectedEmail.category];
    setReplyText(template(selectedEmail));
    toast.success("AI reply drafted — review and send when ready");
  };

  const handleSend = () => {
    toast.success("Reply copied to clipboard — paste into Gmail to send", { duration: 4000 });
    if (replyText) navigator.clipboard.writeText(replyText).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.92 0.012 75)" }}>
            Email Hub
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.008 65)" }}>
            {unread} unread · Membership-relevant emails with AI reply
          </p>
        </div>
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-md border transition-all duration-180"
          style={{ color: "oklch(0.72 0.12 75)", borderColor: "oklch(0.72 0.12 75 / 0.3)", background: "oklch(0.72 0.12 75 / 0.05)" }}
        >
          <ExternalLink size={12} />
          Open Gmail
        </a>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {["All", "inquiry", "renewal", "issue", "event"].map((cat) => {
          const cfg = cat === "All" ? null : CATEGORY_CONFIG[cat as EmailCategory];
          const count = cat === "All" ? EMAILS.length : EMAILS.filter(e => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="text-xs px-3 py-1.5 rounded-md border transition-all duration-180 flex items-center gap-1.5"
              style={{
                background: categoryFilter === cat ? (cfg?.bg || "oklch(0.18 0.008 55)") : "transparent",
                borderColor: categoryFilter === cat ? (cfg?.color || "oklch(0.35 0.008 55)") : "oklch(0.22 0.008 55)",
                color: categoryFilter === cat ? (cfg?.color || "oklch(0.85 0.010 75)") : "oklch(0.50 0.008 65)",
              }}
            >
              {cat === "All" ? "All" : CATEGORY_CONFIG[cat as EmailCategory].label}
              <span className="text-[10px] px-1 rounded" style={{ background: "oklch(0.22 0.008 55 / 0.5)" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: "500px" }}>
        {/* Email list */}
        <div className="lg:col-span-2 space-y-1.5">
          {filtered.map((email) => (
            <button
              key={email.id}
              onClick={() => { setSelectedEmail(email); setReplyText(""); }}
              className="w-full text-left p-3 rounded-lg border transition-all duration-180"
              style={{
                background: selectedEmail?.id === email.id ? "oklch(0.18 0.008 55)" : "oklch(0.12 0.008 55)",
                borderColor: selectedEmail?.id === email.id ? "oklch(0.72 0.12 75 / 0.40)" : "oklch(0.20 0.008 55)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {!email.read && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "oklch(0.72 0.12 75)" }} />
                  )}
                  <span className="text-xs font-semibold truncate" style={{ color: email.read ? "oklch(0.65 0.010 70)" : "oklch(0.90 0.012 75)" }}>
                    {email.from}
                  </span>
                </div>
                <span className="text-[10px] flex-shrink-0" style={{ color: "oklch(0.45 0.006 60)" }}>{email.time}</span>
              </div>
              <p className="text-xs font-medium mb-1 truncate" style={{ color: "oklch(0.75 0.010 72)" }}>{email.subject}</p>
              <p className="text-[11px] truncate" style={{ color: "oklch(0.45 0.006 60)" }}>{email.preview}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: CATEGORY_CONFIG[email.category].bg, color: CATEGORY_CONFIG[email.category].color }}
                >
                  {CATEGORY_CONFIG[email.category].label}
                </span>
                {email.priority === "high" && (
                  <span className="text-[10px]" style={{ color: "oklch(0.70 0.15 30)" }}>● High</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Email detail + reply */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {selectedEmail ? (
            <>
              {/* Email body */}
              <div className="stat-card flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.90 0.012 75)" }}>
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>{selectedEmail.from}</span>
                      <span className="text-xs" style={{ color: "oklch(0.45 0.006 60)" }}>·</span>
                      <span className="text-xs" style={{ color: "oklch(0.45 0.006 60)" }}>{selectedEmail.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: "oklch(0.45 0.006 60)" }}>{selectedEmail.time}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: CATEGORY_CONFIG[selectedEmail.category].bg, color: CATEGORY_CONFIG[selectedEmail.category].color }}
                    >
                      {CATEGORY_CONFIG[selectedEmail.category].label}
                    </span>
                  </div>
                </div>
                <div className="gold-rule mb-4" />
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.75 0.010 72)" }}>
                  {selectedEmail.body}
                </p>
              </div>

              {/* Reply area */}
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail size={13} style={{ color: "oklch(0.72 0.12 75)" }} />
                    <span className="text-xs font-semibold" style={{ color: "oklch(0.72 0.12 75)" }}>Reply</span>
                  </div>
                  <button
                    onClick={generateAIReply}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-180"
                    style={{ background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))", color: "oklch(0.10 0.008 55)" }}
                  >
                    <Sparkles size={11} />
                    AI Draft Reply
                  </button>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Click 'AI Draft Reply' to generate a reply, or type your response here..."
                  rows={8}
                  className="w-full text-xs p-3 rounded-md border outline-none resize-none transition-all duration-180"
                  style={{
                    background: "oklch(0.14 0.008 55)",
                    border: "1px solid oklch(0.22 0.008 55)",
                    color: "oklch(0.85 0.010 75)",
                    lineHeight: "1.6",
                  }}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px]" style={{ color: "oklch(0.40 0.006 55)" }}>
                    Reply will be copied to clipboard — paste into Gmail to send
                  </p>
                  <button
                    onClick={handleSend}
                    disabled={!replyText}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-md font-medium transition-all duration-180 disabled:opacity-40"
                    style={{
                      background: replyText ? "oklch(0.20 0.008 55)" : "transparent",
                      border: "1px solid oklch(0.30 0.008 55)",
                      color: "oklch(0.72 0.12 75)",
                    }}
                  >
                    <Send size={11} />
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="stat-card flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: "oklch(0.40 0.006 55)" }}>Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
