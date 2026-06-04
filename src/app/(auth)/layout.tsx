export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(14, 165, 233, 0.12), transparent 60%), radial-gradient(ellipse at bottom right, rgba(249, 115, 22, 0.08), transparent 60%), linear-gradient(135deg, var(--ukm-dark) 0%, var(--ukm-navy) 60%, #1e3a8a 100%)",
      }}
    >
      {/* Animated decorative blobs */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[28rem] w-[28rem] animate-float-y rounded-full bg-ukm-teal/30 blur-3xl" />
      <div
        className="pointer-events-none absolute -right-40 bottom-10 h-[32rem] w-[32rem] animate-float-y rounded-full bg-ukm-cyan/25 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        className="pointer-events-none absolute right-1/3 top-1/2 h-72 w-72 animate-float-y rounded-full bg-ukm-orange/15 blur-3xl"
        style={{ animationDelay: "2.4s" }}
      />

      {/* Subtle grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">{children}</div>
    </main>
  );
}
