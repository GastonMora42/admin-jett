// =====================================================
// ARCHIVO DE CONFIGURACIÓN - next.config.ts
// =====================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  // Optimización para deploy
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig