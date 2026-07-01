import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="relative rounded-2xl border border-white/20 bg-white/95 p-6 shadow-lift-lg backdrop-blur-xl sm:p-7">
        <h1 className="text-xl font-bold text-ukm-navy">Tetapkan Kata Laluan Baharu</h1>
        {token ? (
          <>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Masukkan kata laluan baharu untuk akaun anda.
            </p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
            Pautan tidak lengkap atau tidak sah. Sila mohon pautan tetapan semula sekali lagi.
          </p>
        )}
        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm font-medium text-ukm-teal hover:underline">
            ← Kembali ke log masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
