import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Não gerar o AGENTS.md automático do Next.js.
  agentRules: false,
};

export default nextConfig;
