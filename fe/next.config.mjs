/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/oms/:path*',
          destination: 'http://127.0.0.1:5000/api/:path*',
        },
        {
          source: '/api/masterdata/:path*',
          destination: 'http://127.0.0.1:5052/api/:path*',
        },
        {
          source: '/health/oms',
          destination: 'http://127.0.0.1:5000/health',
        },
        {
          source: '/health/wms',
          destination: 'http://127.0.0.1:5051/health',
        },
        {
          source: '/health/masterdata',
          destination: 'http://127.0.0.1:5052/health',
        },
      ],
      afterFiles: [],
      // fallback rewrites are checked LAST — after all filesystem routes
      // including dynamic routes like app/api/wms/roles/[id]/route.ts.
      // This ensures our API route handlers (which inject auth tokens)
      // take priority over the proxy rewrite.
      fallback: [
        {
          source: '/api/wms/:path*',
          destination: 'http://127.0.0.1:5051/api/:path*',
        },
      ],
    }
  },
}

export default nextConfig

