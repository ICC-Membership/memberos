/*
 * DashboardLayout — ICC Membership OS
 * Design: Refined Dark Luxury / Private Members Club
 * Fixed left sidebar (dark leather texture), main content area with top bar
 * Gold accent nav items, Playfair Display branding
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Archive,
  Mail,
  Target,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Command Center" },
  { href: "/members", icon: Users, label: "Members" },
  { href: "/power-rankings", icon: Trophy, label: "Power Rankings" },
  { href: "/lockers", icon: Archive, label: "Locker Diagram" },
  { href: "/email", icon: Mail, label: "Email Hub" },
  { href: "/strategy", icon: Target, label: "Strategy" },
  { href: "/training", icon: BookOpen, label: "Training" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 h-full flex flex-col transition-all duration-300 ease-out
          ${collapsed ? "w-[68px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: `linear-gradient(180deg, oklch(0.07 0.010 52) 0%, oklch(0.09 0.008 55) 100%)`,
          borderRight: "1px solid oklch(0.20 0.008 55)",
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: "oklch(0.20 0.008 55)" }}
        >
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))",
            }}
          >
            <span className="text-xs font-bold" style={{ color: "oklch(0.10 0.008 55)", fontFamily: "'Playfair Display', serif" }}>
              ICC
            </span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p
                className="text-sm font-semibold leading-tight truncate"
                style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.92 0.012 75)" }}
              >
                Industrial Cigar
              </p>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "oklch(0.72 0.12 75)" }}>
                Membership OS
              </p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <div
                  className={`nav-item ${isActive ? "active" : ""}`}
                  style={isActive ? { borderLeftWidth: "2px", paddingLeft: "10px" } : {}}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: collapse toggle + user */}
        <div
          className="p-3 border-t space-y-2"
          style={{ borderColor: "oklch(0.20 0.008 55)" }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md" style={{ background: "oklch(0.14 0.008 55)" }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))", color: "oklch(0.10 0.008 55)" }}
              >
                AF
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate" style={{ color: "oklch(0.85 0.010 75)" }}>Andrew Frakes</p>
                <p className="text-[10px] truncate" style={{ color: "oklch(0.55 0.008 65)" }}>Head of Membership</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-1.5 rounded-md transition-colors duration-180"
            style={{ color: "oklch(0.50 0.008 65)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.72 0.12 75)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.50 0.008 65)")}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-3 border-b flex-shrink-0"
          style={{
            background: "oklch(0.10 0.008 55)",
            borderColor: "oklch(0.20 0.008 55)",
          }}
        >
          <button
            className="lg:hidden p-1.5 rounded-md"
            style={{ color: "oklch(0.65 0.010 70)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={18} />
          </button>

          {/* Rock progress bar */}
          <div className="flex-1 flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "oklch(0.55 0.008 65)" }}>
                Q1 Rock
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-32 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "oklch(0.22 0.008 55)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: "90%",
                      background: "linear-gradient(90deg, oklch(0.72 0.12 75), oklch(0.80 0.14 78))",
                    }}
                  />
                </div>
                <span className="text-xs font-semibold" style={{ color: "oklch(0.80 0.14 78)" }}>
                  135 / 150
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "oklch(0.72 0.12 75)" }}
              />
              <span className="text-xs" style={{ color: "oklch(0.55 0.008 65)" }}>
                15 members to April 1st goal
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-2">
            <a
              href="https://admin.shopify.com/store/08bcdd/apps/appstle-memberships/dashboards/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-md border transition-all duration-180"
              style={{
                color: "oklch(0.72 0.12 75)",
                borderColor: "oklch(0.72 0.12 75 / 0.3)",
                background: "oklch(0.72 0.12 75 / 0.05)",
              }}
            >
              Appstle
            </a>
            <a
              href="https://app.ninety.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-md border transition-all duration-180"
              style={{
                color: "oklch(0.65 0.010 70)",
                borderColor: "oklch(0.25 0.008 55)",
                background: "transparent",
              }}
            >
              Ninety.io
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
