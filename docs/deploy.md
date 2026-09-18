# Deploy en Vercel

Cómo está montada la tienda en producción y qué hacer para reproducirlo o
tocarlo. Todo lo de acá se hizo con la CLI (`npx vercel`), así que los comandos
son los reales, no una guía aproximada.

## Cómo está armado hoy

| Pieza | Qué es |
| --- | --- |
| Hosting | Proyecto `miniholz`, región `iad1`, conectado al repo de GitHub: cada push a `main` deploya producción |
| Base | Neon Postgres (`miniholz-db`), plan free, región `iad1` |
| Archivos subidos | Vercel Blob (`miniholz-uploads`), público, región `iad1` |
| Migraciones | Corren dentro del build (`prisma migrate deploy && next build`) |

La base y el Blob están en `iad1` a propósito: es donde corren las funciones, y
co-locarlas importa más que la cercanía al usuario, porque cada render hace
varias queries y ese ida y vuelta se multiplica.

## Variables de entorno

Solo estas se leen en runtime y por lo tanto viven en Vercel:

| Variable | Quién la pone | Notas |
| --- | --- | --- |
| `DATABASE_URL` | la integración de Neon | Conexión *pooled*. No tocar a mano |
| `DATABASE_URL_UNPOOLED` | la integración de Neon | Conexión directa; la usan las migraciones |
| `BLOB_READ_WRITE_TOKEN` | la integración de Blob | Su sola presencia hace que la app guarde en Blob en vez de disco |
| `AUTH_SECRET` | a mano | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXT_PUBLIC_BASE_URL` | a mano | Solo en Production, con el dominio real. Se compila en el bundle: si cambia, hay que redeployar |
| `UPLOADS_MAX_SIZE_MB` | a mano | `4`. Más que eso no sirve: Vercel corta los request de más de 4,5 MB antes de que lleguen a la app |
| `MERCADOPAGO_ACCESS_TOKEN` | a mano | Sin esto el checkout no ofrece pago con tarjeta |
| `MERCADOPAGO_WEBHOOK_SECRET` | a mano | Obligatoria: en producción el webhook responde `401` a todo si falta |

**`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `WHATSAPP_NUMBER` y
`BANK_ACCOUNT_INFO` no van en Vercel.** Las lee únicamente `prisma/seed.ts`, que
se corre desde tu máquina; en runtime la tienda toma esos datos de la tabla
`StoreSettings`, editable desde `/admin/configuracion`. Tenerlas cargadas en la
plataforma solo genera la ilusión de que configuran algo.

> El wizard de import de Vercel ofrece precargar las claves que encuentra en
> `.env.example`, y las crea **vacías**. Una variable vacía no es lo mismo que
> una variable ausente para quien la lee: `DATABASE_URL=""` hizo fallar el primer
> deploy con "Falta DATABASE_URL". Si usás el wizard, revisá qué quedó creado.

## Entorno local

`vercel link` y las integraciones escriben `.env.local`, que Next lee con
prioridad sobre `.env`. Para que Prisma y el seed —que corren fuera de Next— vean
lo mismo, ambos importan `prisma/load-env.ts`, que replica esa precedencia.

Consecuencia: **tu entorno local apunta a la misma base y al mismo Blob que
producción.** Para separarlos, creá una branch en Neon y poné su connection
string en `.env.local`.

Para refrescar las variables locales:

```bash
npx vercel env pull
```

## Rehacer la infraestructura desde cero

```bash
npx vercel link --project miniholz
npx vercel integration add neon --plan free_v3 -m region=iad1 -m auth=false -n miniholz-db
npx vercel blob create-store miniholz-uploads --access public --region iad1 --yes
```

`-m auth=false` desactiva Neon Auth: la autenticación la maneja Auth.js contra
nuestra propia tabla `User`.

Después, las variables a mano (una por entorno, el valor por stdin para que no
quede en el historial):

```bash
printf '%s' "<secreto>" | npx vercel env add AUTH_SECRET production --sensitive
printf '%s' "https://<dominio>" | npx vercel env add NEXT_PUBLIC_BASE_URL production --no-sensitive
printf '%s' "4" | npx vercel env add UPLOADS_MAX_SIZE_MB production --no-sensitive
```

## Migraciones

Las corre el build. Es a propósito y no es opcional: la ficha de producto
prerenderiza sus rutas con `generateStaticParams()`, que consulta la base, así
que sin las tablas creadas el build falla.

Usan `DATABASE_URL_UNPOOLED` (ver `prisma7.config.ts`) porque `migrate deploy`
toma un advisory lock de Postgres, y ese lock no sobrevive a un pooler en modo
transacción.

## Datos iniciales

```bash
npx prisma db seed
```

Crea el usuario administrador, la fila de `StoreSettings` **y un catálogo de
muestra de 5 categorías y 8 productos**. Ese catálogo es demo: borralo desde
`/admin/productos` antes de abrir la tienda al público. El seed es idempotente y
no pisa la contraseña del admin si ya existe.

## Acceso público

Los proyectos nuevos vienen con **Deployment Protection** activada: todas las
URLs redirigen al SSO de Vercel y solo entra quien tenga acceso a la cuenta. Para
una tienda pública hay que desactivarla en Settings → Deployment Protection
(conviene dejarla puesta solo para los previews).

Para probar una URL protegida desde la terminal sin desactivar nada:

```bash
npx vercel curl <url>
```

## Mercado Pago en producción

Detallado en [mercadopago.md](mercadopago.md) §"Pasar a producción". En corto:
credenciales `APP_USR-` reales, webhook apuntando a
`https://DOMINIO/api/mercadopago/webhook` con evento **Pagos**, y la clave
secreta **de producción** —distinta de la de prueba— en
`MERCADOPAGO_WEBHOOK_SECRET`.

## Checklist para abrir la tienda

- [ ] `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` cargadas
- [ ] Webhook de MP dado de alta y una compra de prueba acreditada
- [ ] WhatsApp y datos bancarios reales cargados en `/admin/configuracion`
- [ ] Catálogo de muestra borrado
- [ ] Contraseña del admin cambiada
- [ ] Deployment Protection desactivada para producción
- [ ] Dominio propio apuntado y `NEXT_PUBLIC_BASE_URL` actualizada
