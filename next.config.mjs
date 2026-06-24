/** @type {import('next').NextConfig} */
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["patchright", "patchright-core"],
    optimizeCss: true,
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
    if (!supabaseUrl) return [];
    return [
      {
        source: "/playbook/thumbs/:file",
        destination: `${supabaseUrl}/storage/v1/object/public/listing-images/playbook/video-thumbnails/:file`,
      },
    ];
  },
  async redirects() {
    return [
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
        destination: "/playbook",
        permanent: false,
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
        ],
      },
    ];
  },
};

export default nextConfig;
