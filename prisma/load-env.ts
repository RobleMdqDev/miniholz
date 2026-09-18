import { config as loadEnv } from "dotenv";

/**
 * Carga el entorno con el mismo orden de precedencia que usa Next.js:
 * `.env.local` —donde escribe `vercel env pull`— gana sobre `.env`. dotenv
 * nunca pisa una variable ya definida, así que en el build de Vercel, donde las
 * variables llegan por el entorno, esto no hace nada.
 *
 * Lo importan la config de Prisma y el seed, que son los dos procesos que
 * corren fuera de Next y por lo tanto no heredan su resolución de archivos.
 */
loadEnv({ path: ".env.local" });
loadEnv();
