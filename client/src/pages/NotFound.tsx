import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.72 0.12 75)" }}>404</p>
      <p className="text-sm" style={{ color: "oklch(0.55 0.008 65)" }}>Page not found</p>
      <Link href="/">
        <span className="text-xs px-4 py-2 rounded-md" style={{ background: "oklch(0.72 0.12 75 / 0.15)", color: "oklch(0.80 0.14 78)", border: "1px solid oklch(0.72 0.12 75 / 0.30)" }}>
          Back to Command Center
        </span>
      </Link>
    </div>
  );
}
