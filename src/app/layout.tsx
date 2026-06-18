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
         * Apply the saved theme before paint so a dark-mode reload doesn't
         * flash light. Reads the last-known theme from localStorage (mirrored
         * by ThemeApplier from the account-saved value). Sets both data-sb-theme
         * (palette) and data-sb-mode (light|dark). Defaults to aurora when no
         * preference is set (we don't auto-follow OS prefers-color-scheme —
         * the user opts in). Keep the key lists in sync with src/lib/themes.ts.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var keys=['aurora','blush','sunset','mint','midnight','ocean','forest','galaxy'];var dark=['midnight','ocean','forest','galaxy'];var t=localStorage.getItem('ukmfolio-theme');if(keys.indexOf(t)===-1)t='aurora';var r=document.documentElement;r.setAttribute('data-sb-theme',t);r.setAttribute('data-sb-mode',dark.indexOf(t)>-1?'dark':'light');}catch(e){var r2=document.documentElement;r2.setAttribute('data-sb-theme','aurora');r2.setAttribute('data-sb-mode','light');}})();`,
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
