import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "4rem", color: "#C8102E", letterSpacing: "0.04em", lineHeight: 1 }}>404</p>
      <p style={{ fontSize: "0.82rem", color: "#6B6560" }}>Page not found</p>
      <Link href="/">
        <span style={{ fontSize: "0.75rem", padding: "0.5rem 1rem", borderRadius: "0.25rem", background: "rgba(200,16,46,0.12)", color: "#C8102E", border: "1px solid rgba(200,16,46,0.30)", cursor: "pointer" }}>
          Back to Command Center
        </span>
      </Link>
    </div>
  );
}
