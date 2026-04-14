/**
 * AdminRoute — wraps a page component and redirects non-admin users.
 * Usage: <Route path="/commission" component={() => <AdminRoute><CommissionTracker /></AdminRoute>} />
 */
import { useAuth } from "@/_core/hooks/useAuth";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: "#6B6560", fontSize: "0.85rem" }}>Loading…</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="rounded-lg px-6 py-5 text-center"
          style={{ background: "#141414", border: "1px solid #2A2A2A", maxWidth: "380px" }}
        >
          <p
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.08em",
              color: "#C8102E",
              marginBottom: "0.5rem",
            }}
          >
            ADMIN ACCESS ONLY
          </p>
          <p style={{ fontSize: "0.78rem", color: "#6B6560" }}>
            This page is restricted to admin users. Sign in with the owner account to access it.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
