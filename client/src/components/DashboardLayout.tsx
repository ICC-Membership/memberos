/**
 * DashboardLayout — ICC Membership OS Wave 2
 * Design: Industrial Cigar Co. brand identity
 * - Near-black sidebar with ICC red active states (#C8102E)
 * - Real ICC logo (hexagonal badge)
 * - Bebas Neue for display, Inter for body
 * - Red left-border on active nav items
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  User,
  Grid3X3,
  Mail,
  TrendingUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Zap,
  Menu,
  Target,
  UserPlus,
  FileText,
  DollarSign,
  RotateCcw,
  Crown,
  Briefcase,
  Shield,
} from "lucide-react";

const ICC_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663388846002/JxsvGXqZ8SL52kxCjJkGqG/icc-logo_4d91d6f7.png";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Command Center" },
  { href: "/members", icon: Users, label: "Members" },
  { href: "/member360", icon: User, label: "Member 360" },
  { href: "/prospects", icon: UserPlus, label: "Prospects" },
  { href: "/power-rankings", icon: Crown, label: "APEX Power Rankings" },
  { href: "/win-back", icon: RotateCcw, label: "Win-Back Queue" },
  { href: "/lockers", icon: Grid3X3, label: "Locker Diagram" },
  { href: "/email", icon: Mail, label: "Email Hub" },
  { href: "/rocks", icon: Target, label: "EOS Rocks" },
  { href: "/meeting-notes", icon: FileText, label: "L10 Notes" },
  { href: "/growth-engine", icon: Zap, label: "Growth Engine" },
  { href: "/strategy", icon: TrendingUp, label: "Strategy" },
  { href: "/commission", icon: DollarSign, label: "Commission" },
  { href: "/training", icon: BookOpen, label: "Training" },
  { href: "/lit-ventures", icon: Briefcase, label: "Lit-Ventures" },
  { href: "/system-monitor", icon: Shield, label: "System Monitor" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0D0D0D" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-full flex flex-col transition-all duration-200
          ${collapsed ? "w-[56px]" : "w-[220px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "#0A0A0A",
          borderRight: "1px solid #1E1E1E",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-3 flex-shrink-0"
          style={{ height: "52px", borderBottom: "1px solid #1E1E1E" }}
        >
          <img
            src={ICC_LOGO}
            alt="ICC"
            className="flex-shrink-0"
            style={{ width: "30px", height: "30px", objectFit: "contain", filter: "invert(1)" }}
          />
          {!collapsed && (
            <div className="flex flex-col leading-none overflow-hidden">
              <span
                style={{
                  fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                  fontSize: "1.05rem",
                  letterSpacing: "0.05em",
                  color: "#E8E4DC",
                  lineHeight: 1.1,
                }}
              >
                INDUSTRIAL
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#C8102E",
                  textTransform: "uppercase",
                  lineHeight: 1.3,
                }}
              >
                MEMBERSHIP OS
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  className={`nav-item ${isActive ? "active" : ""}`}
                  style={collapsed ? { justifyContent: "center", padding: "0.5rem", borderLeft: "2px solid transparent" } : {}}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Quick links */}
        {!collapsed && (
          <div className="px-3 py-3" style={{ borderTop: "1px solid #1E1E1E" }}>
            <p
              style={{
                fontSize: "0.58rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#2E2E2E",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              Quick Links
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Appstle", url: "https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions" },
                { label: "Ninety.io", url: "https://app.ninety.io" },
                { label: "ICC Website", url: "https://industrialcigars.co" },
                { label: "Typeform", url: "https://admin.typeform.com" },
              ].map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                  style={{ color: "#3A3A3A", fontSize: "0.72rem", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#C8102E")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#3A3A3A")}
                >
                  <ExternalLink size={10} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* User + collapse */}
        <div
          className="flex items-center justify-between px-3 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid #1E1E1E" }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#C8102E", fontFamily: "'Inter', sans-serif" }}
              >
                AF
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#E8E4DC", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Andrew Frakes
                </p>
                <p style={{ fontSize: "0.62rem", color: "#3A3A3A" }}>Head of Membership</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center rounded flex-shrink-0"
            style={{
              width: "22px",
              height: "22px",
              background: "#1C1C1C",
              border: "1px solid #2A2A2A",
              color: "#3A3A3A",
              transition: "all 0.15s",
              marginLeft: collapsed ? "auto" : undefined,
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "#C8102E")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "#3A3A3A")}
          >
            {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{ height: "48px", background: "#0D0D0D", borderBottom: "1px solid #1E1E1E" }}
        >
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden"
              style={{ color: "#4A4A4A" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Menu size={18} />
            </button>
            <span
              style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", color: "#C8102E", textTransform: "uppercase" }}
            >
              Q1 ROCK
            </span>
            <div className="hidden md:flex items-center gap-2">
              <div
                className="rounded-full overflow-hidden"
                style={{ width: "110px", height: "3px", background: "#1E1E1E" }}
              >
                <div className="h-full rounded-full" style={{ width: "90%", background: "#C8102E" }} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#E8E4DC" }}>135 / 150</span>
            </div>
            <span className="hidden lg:block" style={{ fontSize: "0.68rem", color: "#2E2E2E" }}>
              · 15 members to April 1st goal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
              style={{
                fontSize: "0.7rem",
                fontWeight: 500,
                color: "#C8102E",
                padding: "0.28rem 0.65rem",
                border: "1px solid rgba(200,16,46,0.30)",
                borderRadius: "0.25rem",
                background: "rgba(200,16,46,0.06)",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(200,16,46,0.14)")}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(200,16,46,0.06)")}
            >
              <ExternalLink size={10} />
              Appstle
            </a>
            <a
              href="https://app.ninety.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
              style={{
                fontSize: "0.7rem",
                fontWeight: 500,
                color: "#4A4A4A",
                padding: "0.28rem 0.65rem",
                border: "1px solid #2A2A2A",
                borderRadius: "0.25rem",
                background: "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "#E8E4DC")}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "#4A4A4A")}
            >
              <ExternalLink size={10} />
              Ninety.io
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#0D0D0D" }}>
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
