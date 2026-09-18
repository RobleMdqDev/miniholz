import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

export type StoredFile = { url: string; fileName: string };

/**
 * Capa fina sobre el almacenamiento de archivos subidos. Hay dos
 * implementaciones y se elige sola (ver `storage` al final): disco local en
 * desarrollo, Vercel Blob en producción. Quien la usa (rutas de upload,
 * comprobantes, imágenes de producto) no se entera de cuál está activa.
 */
export interface StorageAdapter {
  /** `folder` es relativo a la raíz pública, p. ej. `uploads/receipts/<orderId>`. */
  save(file: File, folder: string): Promise<StoredFile>;
  /** Recibe la url pública devuelta por `save`. */
  delete(url: string): Promise<void>;
}

const PUBLIC_ROOT = path.join(process.cwd(), "public");
/** Todo lo que sube la app vive acá; nada fuera de esta carpeta se borra. */
const UPLOADS_ROOT = "uploads";

/** Solo letras, números, guiones y barras, y siempre dentro de `uploads/`. */
function assertSafeFolder(folder: string) {
  if (!/^[a-zA-Z0-9/_-]+$/.test(folder) || folder.includes("..")) {
    throw new Error(`Carpeta de destino inválida: ${folder}`);
  }
  if (folder !== UPLOADS_ROOT && !folder.startsWith(`${UPLOADS_ROOT}/`)) {
    throw new Error(`La carpeta de destino tiene que estar dentro de ${UPLOADS_ROOT}/: ${folder}`);
  }
}

function extensionFor(file: File): string {
  const fromName = path.extname(file.name).toLowerCase();
  if (/^\.[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return file.type === "application/pdf" ? ".pdf" : ".bin";
}

/**
 * El nombre lo genera el servidor: el del archivo subido no se usa nunca como
 * ruta, para que nadie pueda escribir fuera de su carpeta.
 */
function generatedName(file: File): string {
  return `${randomUUID()}${extensionFor(file)}`;
}

class LocalDiskStorage implements StorageAdapter {
  async save(file: File, folder: string): Promise<StoredFile> {
    assertSafeFolder(folder);

    const fileName = generatedName(file);
    const directory = path.join(PUBLIC_ROOT, folder);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));

    return { url: `/${folder}/${fileName}`, fileName };
  }

  async delete(url: string): Promise<void> {
    // Solo borra lo que subió el propio storage. Sin esta restricción, borrar
    // un producto sembrado con imágenes de `public/images/` se llevaría puestos
    // assets del repo.
    if (!url.startsWith(`/${UPLOADS_ROOT}/`)) return;

    const target = path.join(PUBLIC_ROOT, url.replace(/^\//, ""));
    if (!target.startsWith(path.join(PUBLIC_ROOT, UPLOADS_ROOT) + path.sep)) return;

    await unlink(target).catch(() => {});
  }
}

/**
 * En Vercel el filesystem de la función es efímero y de solo lectura: lo que se
 * escriba en `public/` no sobrevive al request ni lo ve la próxima invocación.
 * Los archivos van entonces al Blob store, que devuelve una URL absoluta y
 * pública servida por CDN (hay que habilitar ese host en `next.config.ts` para
 * que `next/image` la optimice).
 */
class VercelBlobStorage implements StorageAdapter {
  async save(file: File, folder: string): Promise<StoredFile> {
    assertSafeFolder(folder);

    const fileName = generatedName(file);
    // El nombre es un UUID, así que no puede pisar un blob existente y no hace
    // falta `addRandomSuffix` (que ensuciaría la url con un sufijo extra).
    const blob = await put(`${folder}/${fileName}`, file, {
      access: "public",
      contentType: file.type || undefined,
    });

    return { url: blob.url, fileName };
  }

  async delete(url: string): Promise<void> {
    // Mismo criterio que en disco: solo se borra lo que subió este storage.
    // Las urls relativas (`/uploads/...`) son de la etapa de disco local o del
    // seed: no viven en el Blob store y acá se ignoran.
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }

    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) return;
    if (!parsed.pathname.startsWith(`/${UPLOADS_ROOT}/`)) return;

    await del(url).catch(() => {});
  }
}

/**
 * El token lo inyecta Vercel al conectar un Blob store al proyecto; en local no
 * está y se usa el disco, así que `npm run dev` sigue sin depender de la nube.
 */
export const storage: StorageAdapter = process.env.BLOB_READ_WRITE_TOKEN
  ? new VercelBlobStorage()
  : new LocalDiskStorage();

export const RECEIPT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * El default es 4 MB y no 5 a propósito: Vercel corta los request con cuerpo de
 * más de 4,5 MB antes de que lleguen a la función, y ese 413 de la plataforma
 * no se puede transformar en un mensaje de error decente para el usuario.
 */
export function maxUploadBytes(): number {
  const megabytes = Number(process.env.UPLOADS_MAX_SIZE_MB ?? 4);
  return (Number.isFinite(megabytes) && megabytes > 0 ? megabytes : 4) * 1024 * 1024;
}
