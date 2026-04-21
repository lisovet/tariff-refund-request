import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin file-tracing root so Next doesn't pick up a parent-directory
  // lockfile when developers have one in their home directory.
  outputFileTracingRoot: path.resolve(__dirname),
  // Per Next 15.5: typedRoutes is top-level (was experimental).
  typedRoutes: true,
}

export default nextConfig
