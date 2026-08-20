import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // fpl-api pulls in superagent -> formidable, which does a dynamic
  // require() the bundler can't statically resolve. Run it via native
  // Node require instead of bundling it.
  serverExternalPackages: ['fpl-api', 'superagent', 'formidable'],
}

export default nextConfig
