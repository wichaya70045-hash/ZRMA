/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double SSE connection mounts in dev
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*', './node_modules/@prisma/client/**/*'],
  },
};

export default nextConfig;
