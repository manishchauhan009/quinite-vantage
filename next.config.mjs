const nextConfig = {
  output: "standalone",
  images: { 
    unoptimized: true,
    formats: ['image/avif', 'image/webp']
  },
  serverExternalPackages: ["mongodb"],
  // Next.js 16 optimizations
  productionBrowserSourceMaps: false,
};

export default nextConfig;
