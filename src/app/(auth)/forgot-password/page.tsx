import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="relative rounded-2xl border border-white/20 bg-white/95 p-6 shadow-lift-lg backdrop-blur-xl sm:p-7">
        <h1 className="text-xl font-bold text-ukm-navy">Lupa Kata Laluan</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Masukkan no. matrik atau e-mel anda. Kami akan menghantar pautan untuk menetapkan
          semula kata laluan.
        </p>
        <ForgotPasswordForm />
        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm font-medium text-ukm-teal hover:underline">
            ← Kembali ke log masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
