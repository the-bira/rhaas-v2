import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "./",
  },
  serverExternalPackages: ["pdf-parse"],

  // ✅ Multi-Zones: Redireciona /interview para rhaas-interview (opcional)
  // Descomente se quiser usar Multi-Zones no futuro
  // async rewrites() {
  //   return [
  //     {
  //       source: '/interview-external/:path*',
  //       destination: 'http://localhost:3002/interview/:path*', // Desenvolvimento
  //       // destination: 'https://interview.seudominio.com/interview/:path*', // Produção
  //     },
  //   ];
  // },
};

export default nextConfig;
