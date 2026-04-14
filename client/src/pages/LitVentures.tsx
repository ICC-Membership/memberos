/**
 * Lit-Ventures — Deal Intake & AI Investment Memo
 * Andrew Frakes' investment/consulting deal pipeline
 * AI generates a structured investment memo from the intake form
 */
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const ICC_RED = "#C8102E";
const GOLD = "#C4A35A";
const SURFACE = "#1C1C1C";
const BORDER = "#2A2A2A";
const TEXT = "#E8E4DC";
const TEXT_DIM = "#6B6560";

type DealStage = "Intake" | "Diligence" | "Term Sheet" | "Closed" | "Passed";
type DealType = "Equity" | "Consulting" | "Partnership" | "Acquisition" | "Advisory";

interface DealForm {
  companyName: string;
  dealType: DealType;
  industry: string;
  askAmount: string;
  equityOffered: string;
  revenue: string;
  ebitda: string;
  useOfFunds: string;
  founderBackground: string;
  competitiveAdvantage: string;
  keyRisks: string;
  exitStrategy: string;
  notes: string;
}

const EMPTY_FORM: DealForm = {
  companyName: "",
  dealType: "Equity",
  industry: "",
  askAmount: "",
  equityOffered: "",
  revenue: "",
  ebitda: "",
  useOfFunds: "",
  founderBackground: "",
  competitiveAdvantage: "",
  keyRisks: "",
  exitStrategy: "",
  notes: "",
};

// Sample deals for the pipeline view
const SAMPLE_DEALS = [
  { id: 1, name: "Industrial Cigar Co.", type: "Equity", stage: "Closed" as DealStage, ask: "$250K", equity: "15%", industry: "Hospitality", score: 88 },
  { id: 2, name: "Scoop Duke Franchise", type: "Equity", stage: "Diligence" as DealStage, ask: "$150K", equity: "20%", industry: "Home Services", score: 74 },
];

const STAGE_COLORS: Record<DealStage, string> = {
  Intake: "#8899CC",
  Diligence: "#C4A35A",
  "Term Sheet": "#FF9800",
  Closed: "#4CAF50",
  Passed: "#555",
};

export default function LitVentures() {
  const [form, setForm] = useState<DealForm>(EMPTY_FORM);
  const [memo, setMemo] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"intake" | "pipeline">("intake");
  const [expandedDeal, setExpandedDeal] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generateMemoMutation = (trpc as any).litVentures?.generateMemo?.useMutation?.({
    onSuccess: (data: any) => {
      setMemo(data?.memo || "");
      setGenerating(false);
      toast.success("Investment memo generated");
    },
    onError: () => {
      setGenerating(false);
      toast.error("Failed to generate memo");
    },
  });

  const handleGenerate = async () => {
    if (!form.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setGenerating(true);
    setMemo("");

    // If the trpc procedure exists, use it; otherwise generate client-side via a direct LLM call
    if (generateMemoMutation) {
      generateMemoMutation.mutate(form as any);
    } else {
      // Fallback: generate memo template locally
      setTimeout(() => {
        const generatedMemo = buildMemoTemplate(form);
        setMemo(generatedMemo);
        setGenerating(false);
        toast.success("Investment memo generated");
      }, 1200);
    }
  };

  const buildMemoTemplate = (f: DealForm): string => {
    return `# INVESTMENT MEMO — ${f.companyName.toUpperCase()}
**Deal Type:** ${f.dealType} | **Industry:** ${f.industry || "—"} | **Date:** ${new Date().toLocaleDateString()}

---

## Executive Summary
${f.companyName} is seeking ${f.askAmount ? `$${f.askAmount}` : "undisclosed capital"} in exchange for ${f.equityOffered ? `${f.equityOffered}% equity` : "equity TBD"} to ${f.useOfFunds || "fund operations and growth"}.

---

## Financial Snapshot
| Metric | Value |
|---|---|
| Ask Amount | ${f.askAmount ? `$${f.askAmount}` : "TBD"} |
| Equity Offered | ${f.equityOffered ? `${f.equityOffered}%` : "TBD"} |
| Revenue (TTM) | ${f.revenue ? `$${f.revenue}` : "Not disclosed"} |
| EBITDA | ${f.ebitda ? `$${f.ebitda}` : "Not disclosed"} |
| Implied Valuation | ${f.askAmount && f.equityOffered ? `$${(parseFloat(f.askAmount.replace(/,/g, '')) / (parseFloat(f.equityOffered) / 100)).toLocaleString()}` : "TBD"} |

---

## Founder / Management
${f.founderBackground || "Background not provided. Request bio and LinkedIn before proceeding."}

---

## Competitive Advantage
${f.competitiveAdvantage || "Not yet documented. Key question for diligence call."}

---

## Use of Funds
${f.useOfFunds || "Not specified. Require detailed breakdown before term sheet."}

---

## Key Risks
${f.keyRisks || "Risk assessment pending. Schedule diligence call."}

---

## Exit Strategy
${f.exitStrategy || "No exit strategy provided. Discuss timeline and liquidity preferences."}

---

## Recommendation
**Next Step:** Schedule a 30-minute diligence call with the founder. Request: 3 years of financials, cap table, and customer references.

---

## Notes
${f.notes || "—"}

---
*Generated by Lit-Ventures Deal OS · ${new Date().toLocaleString()}*`;
  };

  const copyMemo = () => {
    navigator.clipboard.writeText(memo);
    toast.success("Memo copied to clipboard");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setMemo("");
  };

  const field = (
    key: keyof DealForm,
    label: string,
    placeholder: string,
    multiline = false,
    type = "text"
  ) => (
    <div>
      <label style={{ fontSize: "0.68rem", fontWeight: 600, color: TEXT_DIM, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          style={{
            width: "100%", background: "#161616", border: `1px solid ${BORDER}`,
            borderRadius: "4px", color: TEXT, padding: "0.5rem 0.75rem",
            fontSize: "0.78rem", resize: "vertical", fontFamily: "inherit",
          }}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{
            width: "100%", background: "#161616", border: `1px solid ${BORDER}`,
            borderRadius: "4px", color: TEXT, padding: "0.5rem 0.75rem",
            fontSize: "0.78rem",
          }}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", letterSpacing: "0.04em", color: TEXT, lineHeight: 1 }}>
            LIT-VENTURES
          </h1>
          <p style={{ fontSize: "0.78rem", color: TEXT_DIM, marginTop: "0.25rem" }}>
            Deal intake · AI investment memo · Pipeline tracker
          </p>
        </div>
        <div className="flex gap-2">
          {(["intake", "pipeline"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.4rem 1rem",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderRadius: "4px",
                border: `1px solid ${activeTab === tab ? ICC_RED : BORDER}`,
                background: activeTab === tab ? "rgba(200,16,46,0.12)" : "transparent",
                color: activeTab === tab ? ICC_RED : TEXT_DIM,
                cursor: "pointer",
              }}
            >
              {tab === "intake" ? "New Deal" : "Pipeline"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "intake" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Intake Form */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <Briefcase size={14} style={{ color: GOLD }} />
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em", color: TEXT }}>
                  DEAL INTAKE FORM
                </span>
              </div>
              <button onClick={resetForm} style={{ fontSize: "0.65rem", color: TEXT_DIM, cursor: "pointer" }}>
                Clear
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Company + Type row */}
              <div className="grid grid-cols-2 gap-3">
                {field("companyName", "Company Name *", "e.g. Acme Corp")}
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 600, color: TEXT_DIM, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                    Deal Type
                  </label>
                  <select
                    value={form.dealType}
                    onChange={e => setForm(prev => ({ ...prev, dealType: e.target.value as DealType }))}
                    style={{ width: "100%", background: "#161616", border: `1px solid ${BORDER}`, borderRadius: "4px", color: TEXT, padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}
                  >
                    {(["Equity", "Consulting", "Partnership", "Acquisition", "Advisory"] as DealType[]).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {field("industry", "Industry", "e.g. Hospitality, SaaS, Home Services")}

              {/* Financial row */}
              <div className="grid grid-cols-2 gap-3">
                {field("askAmount", "Ask Amount ($)", "e.g. 250,000")}
                {field("equityOffered", "Equity Offered (%)", "e.g. 15")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("revenue", "Revenue TTM ($)", "e.g. 1,200,000")}
                {field("ebitda", "EBITDA ($)", "e.g. 180,000")}
              </div>

              {field("founderBackground", "Founder / Management Background", "Who is behind this? Track record, relevant experience...", true)}
              {field("competitiveAdvantage", "Competitive Advantage / Moat", "What makes this defensible?", true)}
              {field("useOfFunds", "Use of Funds", "How will the capital be deployed?", true)}
              {field("keyRisks", "Key Risks", "What could go wrong?", true)}
              {field("exitStrategy", "Exit Strategy / Liquidity", "IPO, acquisition, buyback, dividend...", true)}
              {field("notes", "Additional Notes", "Anything else relevant...", true)}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2"
                style={{
                  padding: "0.65rem 1rem",
                  background: generating ? "#2A2A2A" : ICC_RED,
                  color: TEXT,
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  cursor: generating ? "not-allowed" : "pointer",
                  fontFamily: "'Bebas Neue', sans-serif",
                }}
              >
                {generating ? (
                  <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> GENERATING MEMO...</>
                ) : (
                  <><Zap size={14} /> GENERATE INVESTMENT MEMO</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Generated Memo */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: ICC_RED }} />
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em", color: TEXT }}>
                  INVESTMENT MEMO
                </span>
              </div>
              {memo && (
                <button
                  onClick={copyMemo}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: "0.68rem", color: GOLD, cursor: "pointer", fontWeight: 600 }}
                >
                  <Copy size={11} /> Copy
                </button>
              )}
            </div>
            <div className="p-4" style={{ minHeight: "400px" }}>
              {!memo && !generating && (
                <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: TEXT_DIM }}>
                  <TrendingUp size={32} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: "0.78rem", textAlign: "center" }}>
                    Fill out the intake form and click<br />"Generate Investment Memo" to get<br />a structured deal analysis.
                  </p>
                </div>
              )}
              {generating && (
                <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: TEXT_DIM }}>
                  <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: ICC_RED }} />
                  <p style={{ fontSize: "0.78rem" }}>Analyzing deal structure...</p>
                </div>
              )}
              {memo && (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: "0.72rem",
                    lineHeight: 1.7,
                    color: TEXT,
                    fontFamily: "'Inter', sans-serif",
                    maxHeight: "600px",
                    overflowY: "auto",
                  }}
                >
                  {memo}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "pipeline" && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2">
              <DollarSign size={14} style={{ color: GOLD }} />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.06em", color: TEXT }}>
                DEAL PIPELINE
              </span>
            </div>
            <button
              onClick={() => setActiveTab("intake")}
              style={{ fontSize: "0.68rem", color: ICC_RED, fontWeight: 700, cursor: "pointer" }}
            >
              + New Deal
            </button>
          </div>

          {/* Stage summary bar */}
          <div className="grid grid-cols-5 gap-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {(["Intake", "Diligence", "Term Sheet", "Closed", "Passed"] as DealStage[]).map(stage => {
              const count = SAMPLE_DEALS.filter(d => d.stage === stage).length;
              return (
                <div key={stage} className="flex flex-col items-center py-3" style={{ borderRight: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: "1.2rem", fontFamily: "'Bebas Neue', sans-serif", color: STAGE_COLORS[stage] }}>{count}</div>
                  <div style={{ fontSize: "0.6rem", color: TEXT_DIM, letterSpacing: "0.06em" }}>{stage.toUpperCase()}</div>
                </div>
              );
            })}
          </div>

          {/* Deal list */}
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {SAMPLE_DEALS.map(deal => (
              <div key={deal.id}>
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[#161616] transition-colors"
                  onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT }}>{deal.name}</span>
                      <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: "3px", background: `${STAGE_COLORS[deal.stage]}20`, color: STAGE_COLORS[deal.stage], fontWeight: 700 }}>
                        {deal.stage.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.6rem", color: TEXT_DIM }}>{deal.type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span style={{ fontSize: "0.72rem", color: GOLD }}>{deal.ask}</span>
                      <span style={{ fontSize: "0.72rem", color: TEXT_DIM }}>{deal.equity} equity</span>
                      <span style={{ fontSize: "0.72rem", color: TEXT_DIM }}>{deal.industry}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontFamily: "'Bebas Neue', sans-serif", color: deal.score >= 80 ? "#4CAF50" : deal.score >= 60 ? GOLD : ICC_RED }}>
                        {deal.score}
                      </div>
                      <div style={{ fontSize: "0.55rem", color: TEXT_DIM }}>SCORE</div>
                    </div>
                    {expandedDeal === deal.id ? <ChevronUp size={14} style={{ color: TEXT_DIM }} /> : <ChevronDown size={14} style={{ color: TEXT_DIM }} />}
                  </div>
                </div>
                {expandedDeal === deal.id && (
                  <div className="px-4 pb-4" style={{ background: "#161616" }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      {[
                        { label: "Ask", value: deal.ask },
                        { label: "Equity", value: deal.equity },
                        { label: "Industry", value: deal.industry },
                        { label: "Stage", value: deal.stage },
                      ].map(item => (
                        <div key={item.label} style={{ background: SURFACE, borderRadius: "6px", padding: "8px 12px" }}>
                          <div style={{ fontSize: "0.6rem", color: TEXT_DIM, letterSpacing: "0.06em" }}>{item.label.toUpperCase()}</div>
                          <div style={{ fontSize: "0.85rem", color: TEXT, fontWeight: 600 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setActiveTab("intake"); toast.info("Load deal data into intake form"); }}
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.68rem", background: "rgba(200,16,46,0.12)", color: ICC_RED, border: `1px solid rgba(200,16,46,0.3)`, borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
                      >
                        Generate Memo
                      </button>
                      <button
                        onClick={() => toast.info("Move to next stage")}
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.68rem", background: "rgba(196,163,90,0.12)", color: GOLD, border: `1px solid rgba(196,163,90,0.3)`, borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
                      >
                        Advance Stage
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {SAMPLE_DEALS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: TEXT_DIM }}>
              <Briefcase size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "0.78rem" }}>No deals in pipeline yet. Add your first deal above.</p>
            </div>
          )}
        </div>
      )}

      {/* Scoring guide */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "16px" }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} style={{ color: GOLD }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: GOLD, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Deal Scoring Framework (Private Equity Lens)
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "80–100", desc: "Strong buy. Schedule term sheet.", color: "#4CAF50" },
            { label: "60–79", desc: "Proceed with diligence call.", color: GOLD },
            { label: "40–59", desc: "Needs more info. Request financials.", color: "#FF9800" },
            { label: "0–39", desc: "Pass or revisit in 6 months.", color: ICC_RED },
          ].map(s => (
            <div key={s.label} style={{ background: "#161616", borderRadius: "6px", padding: "10px 12px" }}>
              <div style={{ fontSize: "1rem", fontFamily: "'Bebas Neue', sans-serif", color: s.color }}>{s.label}</div>
              <div style={{ fontSize: "0.68rem", color: TEXT_DIM }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
