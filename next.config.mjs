/** @type {import('next').NextConfig} */
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");

/** Per-deploy asset prefix busts poisoned browser disk cache for JS chunks. */
const deployAssetId =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
  process.env.VERCEL_DEPLOYMENT_ID?.slice(0, 12) ??
  "local";

const nextConfig = {
  assetPrefix:
    process.env.VERCEL === "1" ? `/_assets/${deployAssetId}` : undefined,
  experimental: {
    serverComponentsExternalPackages: ["patchright", "patchright-core", "pg"],
    // optimizeCss (critters) caused intermittent HTTP 500 on large /playbook/[slug] pages
    // during ISR regen — error HTML included data-critters-container; GSC could not fetch.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "motion",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-navigation-menu",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "patchright", "patchright-core"];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "homeup.sg",
      },
    ],
  },
  async rewrites() {
    const rules = [
      // Serve current chunks for any deploy-scoped asset prefix (handles stale HTML too).
      { source: "/_assets/:build/_next/:path*", destination: "/_next/:path*" },
      // Path-based access to the PropMeta dashboard (works before the subdomain DNS is set).
      { source: "/dashboard", destination: "/dashboard.html" },
      // Per-agent dashboard view (Phase 2); the SPA reads the slug from the URL.
      { source: "/dashboard/a/:slug", destination: "/dashboard.html" },
    ];
    if (supabaseUrl) {
      rules.push({
        source: "/playbook/thumbs/:file",
        destination: `${supabaseUrl}/storage/v1/object/public/listing-images/playbook/video-thumbnails/:file`,
      });
    }
    return rules;
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.homeup.sg" }],
        destination: "https://homeup.sg/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "lp.homeup.sg" }],
        destination: "https://homeup.sg/:path*",
        permanent: true,
      },
      {
        source: "/property-listing",
        destination: "/listings",
        permanent: true,
      },
      {
        source: "/property-listing/:path*",
        destination: "/listings",
        permanent: true,
      },
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/playbook",
        permanent: true,
      },
      {
        source: "/blog/:path*",
        destination: "/playbook/:path*",
        permanent: true,
      },
      {
        source: "/playbook/articles",
        destination: "/playbook",
        permanent: true,
      },
      {
        source: "/playbook/videos",
        destination: "/playbook",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Avoid Cloudflare/Vercel serving stale HTML that references deleted JS chunks.
          { key: "Cache-Control", value: "private, no-cache, no-store, must-revalidate, max-age=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
