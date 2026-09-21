# Plan: MODO y cotización de envíos

Investigación previa a escribir código. Qué hace falta para sumar **MODO** como medio de
pago y **cotización de envíos** (Correo Argentino, Andreani u otros) al checkout.

Estado: ningún código escrito todavía. Este documento existe para decidir antes de tocar el
esquema, porque las dos cosas empujan el mismo cambio de fondo: hoy el pedido se cobra sin
envío y el admin lo completa después.

---

## Lo que hay que decidir antes de empezar

1. **¿El envío se cotiza en el checkout o se sigue cerrando después?**
   Hoy `createOrder` guarda `shippingCost: 0` y `total = subtotal`; el admin carga el costo a
   mano con `setOrderShippingCost`. Cotizar en el checkout cambia eso: el total pasa a incluir
   el envío desde el alta. Es un cambio deseable —y MODO lo vuelve casi obligatorio, porque
   cobra un `amount` fijo de entrada— pero es el que más toca el código existente.
2. **¿Correo directo o agregador?** Integrar Correo Argentino y Andreani por separado son dos
   contratos, dos APIs y dos formatos de tarifa. Un agregador (Envíopack, Zippin) es una sola
   integración que ya cubre a los dos y a unos treinta más.
3. **MODO necesita un gateway previo.** No es un reemplazo de Mercado Pago a nivel de
   adquirencia: corre *arriba* de Payway/Decidir Plus, IPG, Getnet o Line. Sin alta en uno de
   esos, no hay credenciales MODO.

---

# Parte A — MODO

## Qué es, y qué no es

MODO es la billetera de los bancos. El "Botón de Pago" muestra un modal con un QR (desktop) o
redirige a la app del banco / app MODO (mobile). **MODO no procesa el pago: lo enruta a un
gateway.** Por eso el alta tiene dos pasos y el segundo depende del primero.

### Alta y credenciales

1. Estar dado de alta en un gateway: **Decidir Plus (Payway Ventas Online)**, IPG, Getnet o
   Line. Si no hay ninguno, MODO sugiere Decidir Plus.
2. Con el `Site id` + `API Key pública` + `API Key privada` de ese gateway, completar el
   formulario de MODO.
3. A las ~48 hs hábiles llegan por mail las credenciales MODO: **`username`, `password` y los
   `processor_code`** que correspondan.

Para probar sin esperar, MODO publica credenciales genéricas de preproducción en su
documentación (`PLAYDIGITAL SA-318979-preprod`, con `processor_code` por gateway:
`P1019` Decidir/Decidir+, `P1097` IPG, `P1240` Getnet, `P1020` Line). **No tienen webhook
configurado**: para probar notificaciones hay que mandar `webhook_notification` en cada
payment request.

Además del `processor_code` hace falta un **`cc_code`**, que es lo que define la financiación
que ve el comprador (`1CSI` = 1 cuota sin interés, `3CSI-6CSI` = 3 y 6 sin interés, etc.).

## La API

Base URLs:

| Entorno | Base |
|---|---|
| Preproducción | `https://merchants.preprod.playdigital.com.ar` |
| Producción | `https://merchants.playdigital.com.ar` |

**Todas** las llamadas exigen el header `User-Agent: <nombre-del-comercio>`. Sin ese header la
request se rechaza — es el error tonto más fácil de comer.

### 1. Token

```
POST {base}/v2/stores/companies/token
body: { "username": "...", "password": "..." }
201 -> { "access_token": "<JWT>", "token_type": "Bearer", "expires_in": 604800 }
```

Dura **una semana** y el endpoint tiene un **rate limit de 10 pedidos cada 10 minutos**.
Esto no es un detalle: en Vercel cada invocación puede ser una instancia nueva, así que un
caché en memoria de módulo se pierde todo el tiempo y en un pico de tráfico se come el 429.
**El token hay que persistirlo** (ver "Cambios de esquema").

### 2. Crear la Payment Request

```
POST {base}/v2/payment-requests/
headers: Authorization: Bearer <token>, User-Agent: <comercio>, Content-Type: application/json
```

| Campo | Req. | Nota |
|---|---|---|
| `description` | ✅ | máx. 100 caracteres |
| `amount` | ✅ | float en pesos, separador `.` (la base guarda centavos: hay que dividir) |
| `currency` | ✅ | solo `"ARS"` |
| `cc_code` | ✅ | financiación a ofrecer |
| `processor_code` | ✅ | según gateway |
| `external_intention_id` | ✅ | **único por intento**, no por pedido (ver abajo) |
| `expiration_date` | ❌ | ISO 8601. **mín. 5 min, máx. 10 min**, default 10 |
| `webhook_notification` | ❌ | pisa la URL configurada en el alta |
| `customer` | ❌ | `full_name`, `email`, `identification` (DNI/CUIL) requeridos si se manda |
| `shipping_address` | ❌ | `state`, `city`, `zip_code`, `street`, `number` |
| `items` | ❌ | `description`, `quantity`, `unit_price`, `image`, `sku`, `category_name` |

Respuesta `201`: `{ id, qr, deeplink, created_at, expiration_at, expiration_date, ... }`.

Monto mínimo: **$30** en Decidir / Decidir Plus / Line (Getnet: $400).

> ⚠️ **La expiración de 10 minutos es la diferencia de fondo con Mercado Pago.** La preferencia
> de MP se crea una vez y se reutiliza (`getOrderCheckoutUrl` justamente hace eso). Acá no: la
> payment request se crea **cuando el comprador aprieta el botón**, y si vuelve al pedido media
> hora después hay que crear otra. Nada de guardar un link y reusarlo.

### 3. El frontend (SDK)

```html
<script src="https://ecommerce-modal.modo.com.ar/bundle.js"></script>
<!-- preprod: https://ecommerce-modal.preprod.modo.com.ar/bundle.js -->
```

El botón llama a `ModoSDK.modoInitPayment({ version: '2', qrString, checkoutId, deeplink: { url,
callbackURL, callbackURLSuccess }, callbackURL, refreshData, onSuccess, onFailure, onCancel,
onClose })`.

`refreshData` es la función que se ejecuta cuando el usuario toca "Generar nuevo QR" tras un
rechazo, y **tiene que crear una payment request nueva con un `external_intention_id` nuevo**;
repetir el id hace que el gateway rechace la transacción. Por eso el id de intento no puede ser
`order.id`.

### 4. Webhook

MODO notifica los estados `CREATED`, `SCANNED`, `PROCESSING`, `ACCEPTED`, `REJECTED`.
Reintenta `APPROVED`/`REJECTED` hasta 3 veces, **solo ante errores 5xx**, a +2s / +4s / +8s.
Piden devolver `200` inmediato y procesar de forma asincrónica.

La firma viene en el campo `signature` del cuerpo, como **JWS en formato flat (RFC 7515 §7.2.2)**.
Se verifica contra el JWKS de:

```
{base}/v2/payment-requests/.well-known/jwks.json
```

MODO pide **descargar el JWKS una sola vez al inicializar**, no en cada webhook. El ejemplo de
su doc usa `node-jose`; conviene usar **`jose`** en su lugar (mantenida, ESM, y
`createRemoteJWKSet` ya hace el caché con refresco). Verificada la firma, se compara el payload
firmado contra el cuerpo del callback.

### 5. Consultar un pago (plan B)

```
GET {base}/v2/payment-requests/{id}/data
```

Rate limit 600/10 min. **Solo devuelve pagos aprobados, rechazados o devueltos** — no sirve para
consultar uno pendiente. Estados: `ACCEPTED`, `REJECTED`, `REFUNDED`, `PARTIAL_REFUND`.

Es el equivalente a `getMercadoPagoPayment`, y sirve para lo mismo que ya se hace con MP: en
desarrollo, MODO no puede alcanzar `localhost`, así que la sincronización se dispara al volver
del pago (`onSuccess` / `onFailure`) en vez de por webhook.

## Cómo encaja en este código

La forma ya existe y es buena: se copia la separación de Mercado Pago.

| Archivo nuevo | Espejo de |
|---|---|
| `src/lib/modo.ts` | `src/lib/mercadopago.ts` — solo HTTP: token, crear payment request, consultar pago, verificar JWS. No toca la base. |
| `src/lib/modo-orders.ts` | `src/lib/mercadopago-orders.ts` — el puente: crear el intento para un pedido y aplicar el resultado. |
| `src/app/api/modo/payment-request/route.ts` | (nuevo) lo que llama `createPaymentIntention()` del SDK desde el navegador. |
| `src/app/api/modo/webhook/route.ts` | `src/app/api/mercadopago/webhook/route.ts` |
| `src/app/(store)/checkout/modo/[orderId]/page.tsx` | `.../checkout/mercadopago/[orderId]/page.tsx` |

Flujo:

```
/checkout                       el cliente elige "MODO"
  └─> createOrder()             Order (PENDING_PAYMENT) + descuento de stock
       └─> /checkout/modo/[orderId]
            └─ botón "Pagá con MODO"
                 └─ POST /api/modo/payment-request   crea el intento (expira en 10 min)
                      └─ ModoSDK.modoInitPayment(...) modal con QR / deeplink
                           ├─ onSuccess/onFailure  -> sincroniza consultando /data
                           └─ POST /api/modo/webhook -> sincroniza
```

Las dos vueltas tienen que ser idempotentes, igual que hoy con MP. La lógica de
`syncMercadoPagoPayment` —bloquear la fila con `FOR UPDATE`, no dejar que un intento posterior
pise un pago ya acreditado, asentar el evento solo si algo se movió— se traslada tal cual.
Conviene extraerla a una función compartida en vez de duplicarla.

---

# Parte B — Cotización de envíos

## El bloqueador: el catálogo no tiene peso ni medidas

**Ninguna API de envíos cotiza sin peso y dimensiones.** `Product` y `ProductVariant` hoy no
los tienen. Sin ese dato no hay cotización posible, ni con Correo Argentino, ni con Andreani,
ni con un agregador. Es el primer paso de cualquier camino y hay que cargarlo producto por
producto desde el admin.

Detalle no menor para esta tienda: **Correo Argentino tope a 25 kg y 150 cm por lado**. Mesas,
sillas y percheros se van a pasar. El diseño necesita una salida explícita: cuando el bulto no
entra en ningún servicio, mostrar "coordinamos el envío por WhatsApp" en vez de un error, y
dejar el pedido con el flujo de hoy (envío a cotizar).

## Las tres vías

### 1. Agregador — Envíopack o Zippin (recomendada)

Una sola integración, muchos correos. Envíopack:

```
POST https://api.enviopack.com/auth       (form-urlencoded: api-key, secret-key) -> access_token
GET  /cotizar/costo?provincia&codigo_postal&peso&access_token
     opcionales: paquetes ("20x2x10,20x2x10"), bultos, correo, despacho (D|S),
                 modalidad (D=domicilio|S=sucursal), servicio (N|P|X|R)
GET  /cotizar/precio/a-domicilio
GET  /cotizar/precio/a-sucursal          (devuelve las sucursales con dirección y horarios)
```

La respuesta trae una fila por correo/servicio: `correo {id, nombre}`, `modalidad`, `servicio`,
`valor`, `horas_entrega`. Es exactamente la forma que necesita un selector de envío en el
checkout.

La API **bloquea llamadas desde el navegador** a propósito: se consume solo desde el servidor.
En este proyecto eso sale gratis: Server Actions y Route Handlers.

Zippin (ahora `zipnova.com.ar`) es equivalente: REST, token, cotización + etiquetas + tracking.

**Por qué esta primero:** cubre Correo Argentino *y* Andreani *y* OCA con un contrato y una
integración, y la lista de sucursales para retiro viene incluida. Para un catálogo chico es
menos código y menos trámite que dos integraciones directas.

### 2. Correo Argentino directo (Mi Correo / PAQ.AR)

```
Test: https://apitest.correoargentino.com.ar/micorreo/v1
Prod: https://api.correoargentino.com.ar/micorreo/v1

POST /token            Basic (userToken:passwordToken) -> { token, expires }
POST /users/validate   -> customerId
POST /rates            { customerId, postalCodeOrigin, postalCodeDestination,
                         deliveredType: "D"|"S",
                         dimensions: [{ weight (g, 1–25000), height, width, length (cm, ≤150) }] }
                       -> { validTo, rates: [{ deliveredType, productType "CP"|"EP",
                                               productName, price,
                                               deliveryTimeMin, deliveryTimeMax }] }
GET  /agencies?provinceCode=
POST /shipping/import
```

Hacen falta cuatro credenciales: `userToken`/`passwordToken` (se piden por formulario) y el
usuario/contraseña de la cuenta Mi Correo. La respuesta trae `validTo`: la cotización tiene
fecha de vencimiento, así que el caché no puede ser eterno.

> Los campos exactos salen del SDK abierto de la comunidad y coinciden con el PDF oficial de
> Correo Argentino, pero **conviene revalidarlos contra el PDF** (`correoargentino.com.ar` >
> MiCorreo > API) antes de escribir el cliente: no pude extraer el texto del PDF en esta pasada.

### 3. Andreani directo

```
Login Prod: GET https://apis.andreani.com/login   (Basic Auth) -> token, 24 hs
Login QA:   GET https://apisqa.andreani.com/login
Header en el resto de las APIs: x-authorization-token: <token>
```

El catálogo tiene un **Cotizador** bajo *Transporte & Distribución → Pre-envío*, junto con
crear orden de envío, estado y etiquetas. **Requiere ser cliente Andreani**: las credenciales
(incluido el número de contrato y de cliente que pide el cotizador) se generan desde
`andreani.com > Integraciones`, y para el sandbox hay que pedírselas al ejecutivo de cuenta.
La firma exacta del cotizador no la pude verificar sin cuenta —la documentación técnica se
descarga desde el portal— así que ese detalle queda pendiente de confirmar.

### Comparación

| | Envíopack / Zippin | Correo Argentino | Andreani |
|---|---|---|---|
| Integraciones | 1 | 1 | 1 |
| Correos cubiertos | 30+ | 1 | 1 |
| Requisito comercial | cuenta en el agregador | cuenta Mi Correo + formulario | **ser cliente Andreani** |
| Sucursales para retiro | sí, en la cotización | `GET /agencies` | sí |
| Tarifa | la del agregador (suele tener descuento por volumen) | la propia | la negociada por contrato |
| Sandbox sin contrato | sí | sí | no |

**Recomendación:** arrancar con un agregador. Si ya existe contrato con Andreani o cuenta
Mi Correo con tarifa negociada, la integración directa de *ese* correo gana por precio, y el
agregador queda como segunda opción para el resto del país.

## Cómo encaja en este código

El principio que ya sostiene `createOrder` se mantiene sin cambios: **lo que manda el cliente
son ids, no precios**. El costo de envío que elige el comprador se vuelve a cotizar en el
servidor dentro de `createOrder` antes de guardarlo; el valor que viaja desde el navegador es
solo la opción elegida (correo + servicio + modalidad + sucursal).

```
/checkout
  ├─ el cliente completa CP y provincia
  ├─ Server Action cotizarEnvio(cp, provincia, lineas)  -> lista de opciones
  ├─ elige una (y sucursal, si es retiro)
  └─ createOrder(..., opcionElegida)
       └─ recotiza en el servidor, guarda carrier/servicio/costo y total = subtotal + envío
```

Archivos nuevos, en la misma línea que el resto:

| Archivo | Qué hace |
|---|---|
| `src/lib/shipping/<proveedor>.ts` | cliente HTTP puro del proveedor, sin base |
| `src/lib/shipping/quotes.ts` | arma el bulto desde las líneas del carrito, normaliza opciones, cachea |
| `src/actions/shipping.actions.ts` | la Server Action que consume el checkout |
| `src/components/checkout/ShippingOptions.tsx` | el selector |

---

## Cambios de esquema (comunes a las dos partes)

```prisma
enum PaymentMethod {
  MERCADOPAGO
  MODO          // nuevo
  TRANSFER
  WHATSAPP
}
```

**Producto — peso y medidas.** En `ProductVariant` como override nullable y en `Product` como
default, porque el esquema ya contempla variantes que son medidas ("50 cm"):

```prisma
model Product {
  weightGrams Int?
  lengthCm    Int?
  widthCm     Int?
  heightCm    Int?
}
model ProductVariant {
  weightGrams Int?   // si es null, usa el del producto
  lengthCm    Int?
  widthCm     Int?
  heightCm    Int?
}
```

**Pedido — el envío elegido.** Hoy solo hay `shippingCost`:

```prisma
model Order {
  shippingCarrier     String?   // "andreani", "correo-argentino", ...
  shippingServiceName String?   // lo que se le muestra al cliente
  shippingMode        String?   // "D" domicilio | "S" sucursal
  shippingBranchCode  String?
  shippingBranchName  String?
  shippingQuotedAt    DateTime?
}
```

**Pedido — referencias de pago.** `mpPreferenceId` y `mpPaymentId` son específicos de MP, y
`OrderEvent.mpPaymentId` es lo que hoy da idempotencia al webhook. Con un segundo proveedor hay
dos caminos:

- *Mínimo:* agregar `modoPaymentRequestId` en paralelo. No toca nada de lo que anda.
- *Prolijo:* generalizar a `paymentIntentId` / `paymentTransactionId` en `Order` y
  `providerPaymentId` en `OrderEvent`, migrando los valores existentes. Es un rename con
  migración, y paga cuando entre el tercer medio de pago.

Me inclino por el segundo: el costo es una migración de rename, y deja de haber campos que
mienten sobre su contenido.

**Intentos de pago.** MODO obliga a un `external_intention_id` nuevo por intento (`refreshData`),
y el webhook vuelve con el id de la payment request. Para mapear de vuelta al pedido hace falta
guardar cada intento:

```prisma
model PaymentAttempt {
  id                  String   @id @default(cuid())
  orderId             String
  order               Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  provider            String   // "MODO"
  externalIntentionId String   @unique
  providerRequestId   String?  @unique  // el id que devuelve MODO
  status              String
  createdAt           DateTime @default(now())

  @@index([orderId])
}
```

**Tokens de integración.** MODO (1 semana, 10 req/10 min), Correo Argentino y Andreani (24 hs)
entregan tokens que hay que reutilizar. En serverless no alcanza con memoria:

```prisma
model IntegrationToken {
  provider  String   @id   // "modo" | "correo-argentino" | "andreani" | "enviopack"
  token     String
  expiresAt DateTime
  updatedAt DateTime @updatedAt
}
```

**`OrderEventType`.** `SHIPPING_COST_SET` ya existe y alcanza; solo cambia el `detail`, que pasa
a nombrar el correo y el servicio.

## Variables de entorno nuevas

```bash
# MODO
MODO_BASE_URL="https://merchants.preprod.playdigital.com.ar"
MODO_USERNAME=""
MODO_PASSWORD=""
MODO_PROCESSOR_CODE=""        # P1019 Decidir/Decidir+, P1097 IPG, P1240 Getnet, P1020 Line
MODO_CC_CODE="1CSI"           # financiación ofrecida
MODO_MERCHANT_NAME="MiniHolz" # va en el header User-Agent; sin esto rechazan la request
NEXT_PUBLIC_MODO_MODAL_URL="https://ecommerce-modal.preprod.modo.com.ar/bundle.js"

# Envíos (según el proveedor que se elija)
SHIPPING_PROVIDER="enviopack"
SHIPPING_ORIGIN_POSTAL_CODE=""
ENVIOPACK_API_KEY=""
ENVIOPACK_SECRET_KEY=""
```

Igual que con `isMercadoPagoEnabled()`, cada integración necesita su chequeo: sin credenciales,
MODO no se ofrece en el checkout y el envío vuelve a "se cotiza aparte". Nunca prometer una
opción que va a fallar.

---

## Orden de trabajo sugerido

1. **Peso y medidas en el catálogo** — esquema + `ProductForm` + carga de los productos. Es
   prerequisito de todo lo de envíos y no depende de ninguna decisión comercial.
2. **Cotización de envíos** con un proveedor, primero en el checkout, después el selector de
   sucursal. Incluye la salida "no cotizable → coordinamos".
3. **`total` con envío incluido** en `createOrder`, y ajustar el panel del admin (el costo
   manual pasa a ser corrección, no carga).
4. **MODO**, una vez que estén las credenciales del gateway. Antes se puede avanzar con las
   credenciales genéricas de preproducción.

Los pasos 1–3 se pueden hacer sin esperar ningún trámite. El 4 está bloqueado por el alta en
Payway (o el gateway que se elija) y las 48 hs de MODO.

## Preguntas abiertas

- ¿Ya hay alta en algún gateway (Payway/Decidir Plus, Getnet, IPG, Line)? Define el
  `processor_code` y si MODO se puede empezar ya.
- ¿Hay contrato con Andreani o cuenta Mi Correo con tarifa negociada? Si sí, integración
  directa de ese correo; si no, agregador.
- ¿Desde qué código postal se despacha? Es el `postalCodeOrigin` de toda cotización.
- ¿Se ofrece retiro en sucursal, o solo envío a domicilio? Cambia el selector y el alta del
  envío.
- ¿Qué financiación se ofrece en MODO (`cc_code`)? Hoy la tienda comunica 3 cuotas.

## Fuentes

- [MODO — documentación de integraciones ecommerce](https://merchants.modo.com.ar/docs)
- [MODO — cómo instalar vía API / plugins](https://www.modo.com.ar/ayuda/preguntas-frecuentes/C%C3%B3mo-instalo-MODO-en-Woocommerce-Magento-o-v%C3%ADa-API)
- [Andreani Developers](https://developers.andreani.com/)
- [Correo Argentino — API MiCorreo (PDF)](https://www.correoargentino.com.ar/MiCorreo/public/img/pag/apiMiCorreo.pdf)
- [Correo Argentino — integrate a PAQ.AR](https://www.correoargentino.com.ar/MiCorreo/public/primeros-pasos)
- [SDK abierto de Correo Argentino (referencia de campos)](https://github.com/YamilEzequiel/correo-argentino)
- [Envíopack — cotizá un envío](https://developers.enviopack.com.ar/cotiza-un-envio)
- [Envíopack — autenticación](https://developers.enviopack.com.ar/autenticacion)
- [Zippin / Zipnova](https://www.zippin.com.ar/precios)
