/**
 * System Monitor — ICC Membership OS
 * Error log, integration health, and n8n workflow JSON exports
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Download, RefreshCw, Trash2, Zap, Shield } from "lucide-react";

// ─── n8n Workflow Definitions ─────────────────────────────────────────────────
const N8N_WORKFLOWS = [
  {
    id: "morning-briefing",
    name: "Morning Briefing",
    description: "Runs daily at 7am — pulls live Appstle stats, formats a summary, sends email to Andrew",
    trigger: "Schedule (7:00 AM daily)",
    nodes: 5,
    workflow: {
      name: "ICC Morning Briefing",
      nodes: [
        {
          id: "schedule",
          name: "Schedule Trigger",
          type: "n8n-nodes-base.scheduleTrigger",
          parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 7 * * *" }] } },
          position: [240, 300],
        },
        {
          id: "fetch-stats",
          name: "Fetch Appstle Stats",
          type: "n8n-nodes-base.httpRequest",
          parameters: {
            method: "GET",
            url: "={{$env.ICC_OS_URL}}/api/trpc/shopify.liveStats",
            authentication: "none",
          },
          position: [460, 300],
        },
        {
          id: "fetch-rocks",
          name: "Fetch EOS Rocks",
          type: "n8n-nodes-base.httpRequest",
          parameters: {
            method: "GET",
            url: "={{$env.ICC_OS_URL}}/api/trpc/rocks.list?input=%7B%22quarter%22%3A%22Q1+2026%22%7D",
          },
          position: [460, 460],
        },
        {
          id: "format-email",
          name: "Format Morning Briefing",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `const stats = $('Fetch Appstle Stats').first().json?.result?.data;
const rocks = $('Fetch EOS Rocks').first().json?.result?.data ?? [];
const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const subject = \`ICC Morning Briefing — \${date}\`;
const body = \`
<h2>ICC Membership OS — Morning Briefing</h2>
<p><strong>Date:</strong> \${date}</p>
<h3>Key Metrics</h3>
<ul>
  <li>Active Members: <strong>\${stats?.active ?? 'N/A'}</strong></li>
  <li>Monthly MRR: <strong>$\${(stats?.mrr ?? 0).toLocaleString()}</strong></li>
  <li>Paused: \${stats?.paused ?? 0}</li>
  <li>Dunning: \${stats?.dunning ?? 0}</li>
</ul>
<h3>Q1 Rocks Progress</h3>
\${rocks.slice(0,3).map(r => \`<li>\${r.title}: \${r.progressPct ?? 0}%</li>\`).join('')}
\`;
return [{ json: { subject, body } }];`,
          },
          position: [680, 380],
        },
        {
          id: "send-email",
          name: "Send Email to Andrew",
          type: "n8n-nodes-base.emailSend",
          parameters: {
            toEmail: "andrew@industrialcigars.com",
            subject: "={{$json.subject}}",
            emailType: "html",
            html: "={{$json.body}}",
          },
          position: [900, 380],
        },
      ],
      connections: {
        "Schedule Trigger": { main: [[{ node: "Fetch Appstle Stats", type: "main", index: 0 }, { node: "Fetch EOS Rocks", type: "main", index: 0 }]] },
        "Fetch Appstle Stats": { main: [[{ node: "Format Morning Briefing", type: "main", index: 0 }]] },
        "Fetch EOS Rocks": { main: [[{ node: "Format Morning Briefing", type: "main", index: 0 }]] },
        "Format Morning Briefing": { main: [[{ node: "Send Email to Andrew", type: "main", index: 0 }]] },
      },
    },
  },
  {
    id: "typeform-prospect",
    name: "Typeform → Prospect Pipeline",
    description: "Webhook fires when Typeform form is submitted — creates prospect record in ICC OS",
    trigger: "Webhook (Typeform)",
    nodes: 4,
    workflow: {
      name: "ICC Typeform → Prospect",
      nodes: [
        {
          id: "webhook",
          name: "Typeform Webhook",
          type: "n8n-nodes-base.webhook",
          parameters: { path: "typeform-prospect", httpMethod: "POST" },
          position: [240, 300],
        },
        {
          id: "extract",
          name: "Extract Form Fields",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `const body = $input.first().json;
const answers = body.form_response?.answers ?? [];
const getAnswer = (ref) => answers.find(a => a.field?.ref === ref)?.text ?? answers.find(a => a.field?.ref === ref)?.email ?? '';
return [{
  json: {
    name: getAnswer('name') || body.form_response?.hidden?.name || 'Unknown',
    email: getAnswer('email'),
    phone: getAnswer('phone'),
    source: 'Typeform',
    notes: getAnswer('notes') || getAnswer('how_did_you_hear'),
  }
}];`,
          },
          position: [460, 300],
        },
        {
          id: "create-prospect",
          name: "Create Prospect in ICC OS",
          type: "n8n-nodes-base.httpRequest",
          parameters: {
            method: "POST",
            url: "={{$env.ICC_OS_URL}}/api/trpc/prospects.create",
            body: { mode: "json", json: "={{JSON.stringify({json: $json})}}" },
            headers: { "Content-Type": "application/json" },
          },
          position: [680, 300],
        },
        {
          id: "notify",
          name: "Notify Andrew",
          type: "n8n-nodes-base.emailSend",
          parameters: {
            toEmail: "andrew@industrialcigars.com",
            subject: "New Prospect: ={{$('Extract Form Fields').first().json.name}}",
            text: "New prospect submitted via Typeform. Check the Prospect Pipeline in ICC OS.",
          },
          position: [900, 300],
        },
      ],
      connections: {
        "Typeform Webhook": { main: [[{ node: "Extract Form Fields", type: "main", index: 0 }]] },
        "Extract Form Fields": { main: [[{ node: "Create Prospect in ICC OS", type: "main", index: 0 }]] },
        "Create Prospect in ICC OS": { main: [[{ node: "Notify Andrew", type: "main", index: 0 }]] },
      },
    },
  },
  {
    id: "payment-failure",
    name: "Payment Failure Alert",
    description: "Fires when Appstle webhook detects a failed payment — logs to error monitor, queues win-back",
    trigger: "Webhook (Appstle/Shopify)",
    nodes: 5,
    workflow: {
      name: "ICC Payment Failure Handler",
      nodes: [
        {
          id: "webhook",
          name: "Appstle Payment Webhook",
          type: "n8n-nodes-base.webhook",
          parameters: { path: "appstle-payment-failure", httpMethod: "POST" },
          position: [240, 300],
        },
        {
          id: "filter",
          name: "Filter Failed Payments",
          type: "n8n-nodes-base.filter",
          parameters: { conditions: { options: { caseSensitive: true, leftValue: "={{$json.event_type}}", operation: "contains", rightValue: "payment_failed" } } },
          position: [460, 300],
        },
        {
          id: "log-error",
          name: "Log to ICC Error Monitor",
          type: "n8n-nodes-base.httpRequest",
          parameters: {
            method: "POST",
            url: "={{$env.ICC_OS_URL}}/api/trpc/systemErrors.log",
            body: { mode: "json", json: '={"json":{"service":"appstle","errorType":"payment_failed","message":"Payment failed for {{$json.customer?.email}}"}}' },
          },
          position: [680, 300],
        },
        {
          id: "notify",
          name: "Alert Andrew",
          type: "n8n-nodes-base.emailSend",
          parameters: {
            toEmail: "andrew@industrialcigars.com",
            subject: "⚠️ Payment Failed: ={{$json.customer?.first_name}} ={{$json.customer?.last_name}}",
            text: "A member payment has failed. Check the Dunning queue in ICC OS → Members.",
          },
          position: [900, 300],
        },
        {
          id: "queue-winback",
          name: "Queue Win-Back Draft",
          type: "n8n-nodes-base.httpRequest",
          parameters: {
            method: "POST",
            url: "={{$env.ICC_OS_URL}}/api/trpc/winBack.queueDraft",
            body: { mode: "json", json: '={"json":{"email":"{{$json.customer?.email}}","reason":"payment_failed"}}' },
          },
          position: [900, 460],
        },
      ],
      connections: {
        "Appstle Payment Webhook": { main: [[{ node: "Filter Failed Payments", type: "main", index: 0 }]] },
        "Filter Failed Payments": { main: [[{ node: "Log to ICC Error Monitor", type: "main", index: 0 }]] },
        "Log to ICC Error Monitor": { main: [[{ node: "Alert Andrew", type: "main", index: 0 }, { node: "Queue Win-Back Draft", type: "main", index: 0 }]] },
      },
    },
  },
  {
    id: "winback-refresh",
    name: "Weekly Win-Back Refresh",
    description: "Runs every Monday — scans cancelled members, auto-drafts re-engagement emails via AI",
    trigger: "Schedule (Monday 8:00 AM)",
    nodes: 4,
    workflow: {
      name: "ICC Weekly Win-Back Refresh",
      nodes: [
        {
          id: "schedule",
          name: "Weekly Schedule",
          type: "n8n-nodes-base.scheduleTrigger",
          parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 8 * * 1" }] } },
          position: [240, 300],
        },
        {
          id: "fetch-cancelled",
          name: "Fetch Cancelled Members",
          type: "n8n-nodes-base.httpRequest",
          parameters: {
            method: "GET",
            url: "={{$env.ICC_OS_URL}}/api/trpc/winBack.queue",
          },
          position: [460, 300],
        },
        {
          id: "draft-emails",
          name: "Trigger AI Draft for Each",
          type: "n8n-nodes-base.httpRequest",
          parameters: {
            method: "POST",
            url: "={{$env.ICC_OS_URL}}/api/trpc/winBack.draftEmail",
            body: { mode: "json", json: '={"json":{"memberId":{{$json.id}}}}' },
          },
          position: [680, 300],
        },
        {
          id: "notify",
          name: "Notify Andrew",
          type: "n8n-nodes-base.emailSend",
          parameters: {
            toEmail: "andrew@industrialcigars.com",
            subject: "Win-Back Queue Updated — ={{$('Fetch Cancelled Members').first().json?.result?.data?.length ?? 0}} drafts ready",
            text: "Your weekly win-back drafts are ready. Review them in ICC OS → Win-Back Queue.",
          },
          position: [900, 300],
        },
      ],
      connections: {
        "Weekly Schedule": { main: [[{ node: "Fetch Cancelled Members", type: "main", index: 0 }]] },
        "Fetch Cancelled Members": { main: [[{ node: "Trigger AI Draft for Each", type: "main", index: 0 }]] },
        "Trigger AI Draft for Each": { main: [[{ node: "Notify Andrew", type: "main", index: 0 }]] },
      },
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SystemMonitor() {
  const [activeTab, setActiveTab] = useState<"errors" | "n8n" | "health">("errors");
  const [resolving, setResolving] = useState<number | null>(null);

  const { data: errors = [], refetch } = trpc.systemErrors.list.useQuery();
  const resolveError = trpc.systemErrors.resolve.useMutation({
    onSuccess: () => { refetch(); setResolving(null); },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });
  const resolveAll = trpc.systemErrors.resolveAll.useMutation({
    onSuccess: () => { toast.success("All errors marked resolved"); refetch(); },
  });

  const unresolvedErrors = (errors as any[]).filter(e => !e.resolved);
  const resolvedErrors = (errors as any[]).filter(e => e.resolved);

  const downloadWorkflow = (wf: typeof N8N_WORKFLOWS[0]) => {
    const blob = new Blob([JSON.stringify(wf.workflow, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icc-n8n-${wf.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${wf.name} workflow`);
  };

  const integrations = [
    { name: "Appstle / Shopify", status: "connected", detail: "Live subscription data syncing" },
    { name: "Lightspeed POS", status: "partial", detail: "OAuth connected, member sync pending" },
    { name: "Typeform", status: "connected", detail: "Inquiry webhook active" },
    { name: "Gmail (MCP)", status: "connected", detail: "MCP server configured" },
    { name: "Google Drive", status: "connected", detail: "rclone configured" },
    { name: "Ninety.io (EOS)", status: "manual", detail: "Manual data entry — no API" },
    { name: "SALTO Door Access", status: "pending", detail: "Integration not started" },
    { name: "Toast POS", status: "pending", detail: "Integration not started" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Shield size={20} style={{ color: "#C8102E" }} />
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", letterSpacing: "0.08em", color: "#E8E4DC", margin: 0 }}>SYSTEM MONITOR</h1>
        </div>
        <p style={{ fontSize: "0.75rem", color: "#4A4540" }}>Error log, integration health, and n8n automation workflow exports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "errors", label: `Errors (${unresolvedErrors.length})` },
          { id: "health", label: "Integration Health" },
          { id: "n8n", label: "n8n Workflows" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "0.25rem",
              fontSize: "0.75rem",
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.05em",
              cursor: "pointer",
              background: activeTab === id ? "#C8102E" : "transparent",
              color: activeTab === id ? "white" : "#6B6560",
              border: `1px solid ${activeTab === id ? "#C8102E" : "#1E1E1E"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error Log Tab */}
      {activeTab === "errors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: "0.78rem", color: "#6B6560" }}>
              {unresolvedErrors.length} unresolved · {resolvedErrors.length} resolved
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => refetch()}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", padding: "0.35rem 0.75rem", borderRadius: "0.25rem", background: "transparent", color: "#6B6560", border: "1px solid #1E1E1E", cursor: "pointer" }}
              >
                <RefreshCw size={11} />
                Refresh
              </button>
              {unresolvedErrors.length > 0 && (
                <button
                  onClick={() => resolveAll.mutate()}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", padding: "0.35rem 0.75rem", borderRadius: "0.25rem", background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)", cursor: "pointer" }}
                >
                  <CheckCircle size={11} />
                  Resolve All
                </button>
              )}
            </div>
          </div>

          {errors.length === 0 ? (
            <div className="icc-card" style={{ padding: "3rem", textAlign: "center" }}>
              <CheckCircle size={32} style={{ color: "#22C55E", margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "0.9rem", color: "#22C55E", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}>ALL SYSTEMS OPERATIONAL</p>
              <p style={{ fontSize: "0.75rem", color: "#3A3A3A", marginTop: "0.5rem" }}>No errors logged</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(errors as any[]).map((err: any) => (
                <div
                  key={err.id}
                  className="icc-card"
                  style={{
                    padding: "1rem 1.25rem",
                    border: `1px solid ${err.resolved ? "#1E1E1E" : "rgba(200,16,46,0.25)"}`,
                    opacity: err.resolved ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {err.resolved
                        ? <CheckCircle size={14} style={{ color: "#22C55E", flexShrink: 0, marginTop: "2px" }} />
                        : <AlertCircle size={14} style={{ color: "#C8102E", flexShrink: 0, marginTop: "2px" }} />
                      }
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "3px", background: "rgba(200,16,46,0.1)", color: "#C8102E", fontWeight: 600 }}>{err.service}</span>
                          {err.errorType && <span style={{ fontSize: "0.7rem", color: "#6B6560" }}>{err.errorType}</span>}
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "#E8E4DC", marginBottom: "0.25rem" }}>{err.message}</p>
                        <p style={{ fontSize: "0.65rem", color: "#3A3A3A" }}>{new Date(err.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {!err.resolved && (
                      <button
                        onClick={() => { setResolving(err.id); resolveError.mutate({ id: err.id }); }}
                        disabled={resolving === err.id}
                        style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", padding: "0.3rem 0.75rem", borderRadius: "0.25rem", background: "rgba(34,197,94,0.08)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer", flexShrink: 0 }}
                      >
                        <Trash2 size={11} />
                        {resolving === err.id ? "..." : "Resolve"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Integration Health Tab */}
      {activeTab === "health" && (
        <div className="space-y-2">
          {integrations.map(({ name, status, detail }) => (
            <div key={name} className="icc-card" style={{ padding: "1rem 1.25rem" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: status === "connected" ? "#22C55E" : status === "partial" ? "#EAB308" : status === "manual" ? "#8899CC" : "#3A3A3A",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#E8E4DC" }}>{name}</p>
                    <p style={{ fontSize: "0.7rem", color: "#6B6560" }}>{detail}</p>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: "0.05em",
                    background: status === "connected" ? "rgba(34,197,94,0.1)" : status === "partial" ? "rgba(234,179,8,0.1)" : status === "manual" ? "rgba(136,153,204,0.1)" : "rgba(58,58,58,0.3)",
                    color: status === "connected" ? "#22C55E" : status === "partial" ? "#EAB308" : status === "manual" ? "#8899CC" : "#3A3A3A",
                  }}
                >
                  {status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* n8n Workflows Tab */}
      {activeTab === "n8n" && (
        <div className="space-y-4">
          <div className="icc-card" style={{ padding: "1rem 1.25rem", border: "1px solid rgba(196,163,90,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: "#C4A35A" }} />
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#C4A35A" }}>How to use these workflows</p>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6B6560", lineHeight: 1.6 }}>
              Download each JSON file and import it into your n8n instance via <strong style={{ color: "#E8E4DC" }}>Workflows → Import from File</strong>.
              Set the <code style={{ background: "#1E1E1E", padding: "1px 4px", borderRadius: "3px", fontSize: "0.7rem" }}>ICC_OS_URL</code> environment variable to your deployed ICC OS URL.
              Configure email credentials in n8n Settings → Credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {N8N_WORKFLOWS.map(wf => (
              <div key={wf.id} className="icc-card" style={{ padding: "1.25rem" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem", letterSpacing: "0.08em", color: "#E8E4DC", marginBottom: "4px" }}>{wf.name}</h3>
                    <p style={{ fontSize: "0.72rem", color: "#6B6560", lineHeight: 1.5 }}>{wf.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "3px", background: "rgba(200,16,46,0.1)", color: "#C8102E" }}>{wf.trigger}</span>
                  <span style={{ fontSize: "0.65rem", color: "#3A3A3A" }}>{wf.nodes} nodes</span>
                </div>
                <button
                  onClick={() => downloadWorkflow(wf)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "100%", justifyContent: "center", padding: "0.5rem", borderRadius: "0.25rem", background: "rgba(196,163,90,0.08)", color: "#C4A35A", border: "1px solid rgba(196,163,90,0.25)", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
                >
                  <Download size={12} />
                  DOWNLOAD JSON
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
