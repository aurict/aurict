import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
}

export default nextConfig
