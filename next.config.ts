
// =====================================================
// ARCHIVO DE CONFIGURACIÓN - next.config.js
// =====================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['localhost'],
  },
  // Configuración para production
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig
