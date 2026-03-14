


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "desk.alicantissima.es",
          },
        ],
        destination: "/desk",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;