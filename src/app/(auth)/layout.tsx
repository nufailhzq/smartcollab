export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, var(--ukm-dark) 0%, var(--ukm-navy) 60%, #1e3a8a 100%)",
      }}
    >
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 rounded-full bg-ukm-teal/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-16 h-[28rem] w-[28rem] rounded-full bg-ukm-cyan/30 blur-3xl" />
      <div className="relative">{children}</div>
    </main>
  );
}
