/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        jspdf: "commonjs jspdf",
        "jspdf-autotable": "commonjs jspdf-autotable",
        zod: "commonjs zod",
        bcryptjs: "commonjs bcryptjs",
      });
    }
    return config;
  },
};

module.exports = nextConfig;
