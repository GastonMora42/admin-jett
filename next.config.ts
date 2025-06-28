// =====================================================
// ARCHIVO DE CONFIGURACIÓN - next.config.ts
// =====================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'], // Actualizado desde experimental.serverComponentsExternalPackages
  images: {
    remotePatterns: [ // Actualizado desde domains
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Configuración para production
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig