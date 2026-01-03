import type { NextConfig } from "next";

// biome-ignore lint/suspicious/noExplicitAny: PWA plugin types
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/.*\/api\/work-orders.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "work-orders-api",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https?:\/\/.*\/api\/equipment.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "equipment-api",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https?:\/\/.*\/api\/inventory\/parts.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "inventory-api",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=self, microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: http://localhost:9000",
      "font-src 'self'",
      "connect-src 'self' http://localhost:9000",
      "frame-src 'self' http://localhost:9000",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16, acknowledge PWA plugin's webpack config
  turbopack: {},
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

const isDev = process.env.NODE_ENV === "development";

module.exports = isDev ? nextConfig : withPWA(nextConfig);
