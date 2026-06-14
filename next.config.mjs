import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      // Whitelist local development lookups
      { protocol: "http", hostname: "localhost" },
      // Whitelist your production VPS server to safely allow profile pics and comment image assets
      { protocol: "http", hostname: "143.198.214.99" },
      { protocol: "https", hostname: "143.198.214.99" },
    ],
  },
};

export default withNextIntl(nextConfig);