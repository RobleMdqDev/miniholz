# Deploy en Vercel

Qué hace falta para poner MiniHolz en producción, en orden. El repo ya está
preparado (Postgres, migraciones y Blob); lo que queda es aprovisionar y cargar
variables.

## Resumen de lo que cambia respecto a desarrollo

| | Desarrollo | Producción |
| --- | --- | --- |
| Base | Postgres local o una branch de Neon | Neon (connection string *pooled*) |
| Archivos subidos | `public/uploads/` (disco) | Vercel Blob |
| Migraciones | `npm run db:migrate` a mano | `prisma migrate deploy`, dentro del build |
| Mercado Pago | credenciales `TEST-`, sin webhook | credenciales reales + webhook firmado |

La elección de storage es automática: `src/lib/storage.ts` usa el Blob solo si
existe `BLOB_READ_WRITE_TOKEN`, que inyecta Vercel. No hay que tocar código.

## 1. Base de datos (Neon)

1. En el proyecto de Vercel → **Storage → Create Database → Neon**. Al conectarlo
   quedan cargadas solas las variables `DATABASE_URL` y `POSTGRES_*`.
2. Verificar que `DATABASE_URL` sea la **pooled** (el host tiene `-pooler`). En
   serverless cada invocación abre su conexión: contra la URL directa la base se
   queda sin slots con poco tráfico.

> **Ojo con el `.env` local.** Hoy sigue diciendo `DATABASE_URL="file:./dev.db"`,
> que es de la etapa SQLite y ya no sirve: el schema es Postgres y la app usa el
> adapter `pg`. Con esa URL, `npm run dev` y `npm run build` fallan con
> `ECONNREFUSED`. Hay que apuntarlo a un Postgres local o a una branch de
> desarrollo de Neon, y volver a sembrar (`npm run db:seed`): los datos que
> estaban en `dev.db` no se migran solos.

## 2. Blob store (imágenes y comprobantes)

Vercel → **Storage → Create → Blob**, conectarlo al proyecto. Eso define
`BLOB_READ_WRITE_TOKEN` y con eso alcanza: las imágenes de producto y los
comprobantes de transferencia pasan a guardarse ahí.

El host del Blob ya está habilitado en `next.config.ts` para `next/image`. Si se
cambia de proveedor, hay que actualizar ese `remotePatterns` o las imágenes
responden `400`.

## 3. Variables de entorno en Vercel

Además de las dos que cargan los servicios anteriores:

| Variable | Valor |
| --- | --- |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXT_PUBLIC_BASE_URL` | el dominio real con `https` y sin barra final |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | credenciales del admin inicial (solo se usan en el seed) |
| `WHATSAPP_NUMBER`, `BANK_ACCOUNT_INFO` | defaults de la tienda; después se editan en `/admin/configuracion` |
| `UPLOADS_MAX_SIZE_MB` | `4`. Más que eso no sirve: Vercel corta los request de más de 4,5 MB antes de que lleguen a la app |
| `MERCADOPAGO_*` | ver el paso 5 |

`NEXT_PUBLIC_BASE_URL` se compila dentro del bundle: si se cambia, hay que
redeployar, no alcanza con guardar la variable.

## 4. Primer deploy y datos iniciales

El `build` corre `prisma migrate deploy` antes de `next build`. Es a propósito y
no es opcional: la ficha de producto prerenderiza sus rutas con
`generateStaticParams()`, que consulta la base, así que sin las tablas creadas el
build falla.

Después del primer deploy, sembrar el admin y la configuración de la tienda —
una vez, desde la máquina local y apuntando a la base de producción:

```bash
DATABASE_URL="<la pooled de Neon>" npm run db:seed
```

El seed es idempotente: si el admin ya existe no le pisa la contraseña.

## 5. Mercado Pago en producción

Los tres pasos están detallados en [mercadopago.md](mercadopago.md) §"Pasar a
producción". En corto:

1. Credenciales de producción (`APP_USR-...`) en `MERCADOPAGO_ACCESS_TOKEN` y
   `MERCADOPAGO_PUBLIC_KEY`.
2. Panel → **Webhooks** apuntando a `https://DOMINIO/api/mercadopago/webhook`,
   evento **Pagos**.
3. La clave secreta **de producción** (es distinta de la de prueba) en
   `MERCADOPAGO_WEBHOOK_SECRET`. Sin ella el endpoint responde `401` a todo y los
   pagos no se acreditan solos.

## Checklist final

- [ ] Neon conectado y `DATABASE_URL` pooled
- [ ] Blob store conectado
- [ ] Variables del paso 3 cargadas (Production y Preview)
- [ ] Deploy verde (las migraciones corrieron en el build)
- [ ] Seed ejecutado y login en `/admin` OK
- [ ] Dominio apuntado y `NEXT_PUBLIC_BASE_URL` con ese dominio
- [ ] Webhook de MP dado de alta y una compra de prueba acreditada
