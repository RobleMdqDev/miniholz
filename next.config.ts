import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las imágenes que sube el admin viven en el Blob store (ver
    // `src/lib/storage.ts`), en otro dominio: sin esto `next/image` responde
    // 400 en producción. El patrón se acota a `uploads/` y sin query string
    // para no convertir el optimizador en un proxy de imágenes ajenas.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        port: "",
        pathname: "/uploads/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
