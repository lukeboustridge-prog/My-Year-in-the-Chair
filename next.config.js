/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "freemasonsnz.org",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};
module.exports = nextConfig;
