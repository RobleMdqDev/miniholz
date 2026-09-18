import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredFile = { url: string; fileName: string };

/**
 * Capa fina sobre el almacenamiento de archivos subidos. Hoy escribe en el
 * disco local; migrar a S3/Cloudinary es reemplazar la implementación sin tocar
 * a quien la usa (rutas de upload, comprobantes, imágenes de producto).
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

class LocalDiskStorage implements StorageAdapter {
  async save(file: File, folder: string): Promise<StoredFile> {
    assertSafeFolder(folder);

    // El nombre lo genera el servidor: el del archivo subido no se usa nunca
    // como ruta, para que nadie pueda escribir fuera de su carpeta.
    const fileName = `${randomUUID()}${extensionFor(file)}`;
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

export const storage: StorageAdapter = new LocalDiskStorage();

export const RECEIPT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function maxUploadBytes(): number {
  const megabytes = Number(process.env.UPLOADS_MAX_SIZE_MB ?? 5);
  return (Number.isFinite(megabytes) && megabytes > 0 ? megabytes : 5) * 1024 * 1024;
}
