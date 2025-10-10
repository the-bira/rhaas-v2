import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: "./",
  },
  // Tratar pdf-parse como pacote externo (não fazer bundle)
  // Isso evita que o código de teste do pdf-parse seja executado
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
