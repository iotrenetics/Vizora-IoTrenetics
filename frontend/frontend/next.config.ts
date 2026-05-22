import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['echarts', 'echarts-for-react', 'zrender'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
