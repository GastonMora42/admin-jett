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
  // Configuración específica para Prisma en producción
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Optimización para deploy
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig