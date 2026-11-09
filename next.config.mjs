/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double SSE connection mounts in dev
  serverExternalPackages: ['node:sqlite'],
};

export default nextConfig;
