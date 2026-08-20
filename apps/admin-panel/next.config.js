/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@kanjijs/core",
    "@kanjijs/common",
    "@kanjijs/contracts",
    "@kanjijs/platform-hono",
    "@kanjijs/store",
    "@kanjijs/auth",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("mongodb");
    }
    return config;
  },
};

module.exports = nextConfig;
