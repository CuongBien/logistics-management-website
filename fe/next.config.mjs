/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/oms/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/api/wms/:path*',
        destination: 'http://localhost:5051/api/:path*',
      },
      {
        source: '/api/masterdata/:path*',
        destination: 'http://localhost:5052/api/:path*',
      },
      {
        source: '/health/oms',
        destination: 'http://localhost:5000/health',
      },
      {
        source: '/health/wms',
        destination: 'http://localhost:5051/health',
      },
      {
        source: '/health/masterdata',
        destination: 'http://localhost:5052/health',
      },
    ]
  },
}

export default nextConfig
