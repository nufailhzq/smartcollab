import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ToastProvider } from "@/components/common/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "UKMFolio — SMARTCOLLAB",
  description: "Sistem Pengurusan Pembelajaran Fakulti Sains dan Teknologi Maklumat, UKM",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/*
         * Apply the saved theme before paint so a midnight-mode reload
         * doesn't flash light. Defaults to aurora when no preference is set
         * (we don't auto-follow OS prefers-color-scheme — user opts in).
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ukmfolio-theme');document.documentElement.setAttribute('data-sb-theme',t==='midnight'?'midnight':'aurora');}catch(e){document.documentElement.setAttribute('data-sb-theme','aurora');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-app)] text-[var(--text)] antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
