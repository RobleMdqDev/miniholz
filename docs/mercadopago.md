# Mercado Pago (Checkout Pro)

Cómo está integrado el pago con tarjeta, cómo probarlo y qué hace falta para pasar a producción.

Se usa **Checkout Pro**: el comprador se va al sitio de Mercado Pago, paga ahí y vuelve. La tienda nunca ve los datos de la tarjeta. SDK oficial `mercadopago` v3.

---

## Mapa del código

| Archivo | Qué hace |
|---|---|
| `src/lib/mercadopago.ts` | Solo habla con la API de MP: crear preferencia, consultar pago, validar firma, mapear estados. No toca la base. |
| `src/lib/mercadopago-orders.ts` | El puente con la base: `getOrderCheckoutUrl()` y `syncMercadoPagoPayment()`. |
| `src/app/api/mercadopago/webhook/route.ts` | Recibe las notificaciones de pago. |
| `src/app/(store)/checkout/mercadopago/[orderId]/page.tsx` | Muestra el botón de pago; también es la pantalla de reintento. |
| `src/app/(store)/checkout/exito\|pendiente\|fallo/page.tsx` | Retorno desde MP. Las tres usan `src/components/checkout/MercadoPagoReturn.tsx`. |

### El flujo

```
/checkout                          el cliente elige "Tarjeta o Mercado Pago"
   └─> createOrder()               crea la Order (PENDING_PAYMENT) y descuenta stock
        └─> /checkout/mercadopago/[orderId]
             ├─ getOrderCheckoutUrl()  crea (o reutiliza) la preferencia
             └─ botón -> init_point    se va al sitio de MP
                  │
                  ├─ vuelve a /checkout/exito|pendiente|fallo  -> sincroniza el pago
                  └─ POST /api/mercadopago/webhook             -> sincroniza el pago
```

Los dos caminos de vuelta hacen lo mismo y son idempotentes: da igual cuál llegue primero, o si llegan los dos.

---

## Variables de entorno

```bash
MERCADOPAGO_ACCESS_TOKEN=""    # obligatoria
MERCADOPAGO_PUBLIC_KEY=""      # hoy NO se usa (ver abajo)
MERCADOPAGO_WEBHOOK_SECRET=""  # obligatoria en producción
```

**`MERCADOPAGO_ACCESS_TOKEN`** — es la única que enciende la integración. Sin ella, el selector del checkout esconde la opción y `createOrder` la rechaza, para no dejar pedidos sin forma de pagarlos.

**`MERCADOPAGO_PUBLIC_KEY`** — el código no la lee. Con Checkout Pro no hay formulario de tarjeta propio que cifrar. Queda declarada porque hace falta si algún día se migra a Bricks (tarjeta embebida en el sitio).

**`MERCADOPAGO_WEBHOOK_SECRET`** — sin ella no se puede distinguir una notificación real de una inventada:

- En **producción** el endpoint rechaza todo con `401`. Falla cerrado a propósito. *Si te olvidás de cargarla, los pagos no se acreditan solos.*
- En **desarrollo** deja pasar con una advertencia en consola, para poder probar con `curl` o con el simulador.
- Admite **varias claves separadas por coma**. Por qué, abajo.

> **La clave es por aplicación, y en pruebas hay dos aplicaciones.** Esto no es
> evidente y cuesta una tarde de depuración.
>
> Las credenciales de prueba de tu aplicación las emite un **usuario de prueba que
> Mercado Pago provisiona solo**, con su propia aplicación (`get_credentials` lo
> dice: *"provided by automatic test user, seller app ID ..."*). Los pagos de
> sandbox los crea **esa** aplicación, así que MP los firma con **su** clave, no
> con la de la aplicación tuya.
>
> El síntoma es desconcertante: el **simulador de notificaciones del panel funciona**
> —firma como tu aplicación— pero los pagos de prueba reales llegan con
> `SignatureMismatch`. No es un bug del manifiesto; son dos claves distintas.
>
> Por eso la variable acepta una lista: se cargan la de sandbox y la de producción
> a la vez y cada notificación valida contra la que le corresponde. Nada se relaja,
> se prueban las dos.
>
> La clave de sandbox se saca del panel **logueado como el usuario de prueba
> vendedor**, en la aplicación de *ese* usuario.

### De dónde salen

[Mercado Pago Developers](https://www.mercadopago.com.ar/developers) → **Tus integraciones** → tu aplicación.

- Access Token y Public Key: menú izquierdo, **Pruebas → Credenciales de prueba** o **Producción → Credenciales de producción**.
- Clave secreta: menú izquierdo, **Webhooks**. Se genera al guardar la URL y los eventos.

> **Ojo con el prefijo.** Las credenciales de producción de una cuenta real empiezan con `APP_USR-`, y las de prueba con `TEST-`. Pero si creás la aplicación **logueado como un usuario de prueba**, sus credenciales también empiezan con `APP_USR-` y aun así son de test. Para salir de la duda:
>
> ```bash
> curl -s https://api.mercadopago.com/users/me -H "Authorization: Bearer $TOKEN"
> ```
>
> Si `tags` incluye `test_user`, es de prueba y no se mueve plata real.

---

## Probar en local

1. Cargá `MERCADOPAGO_ACCESS_TOKEN` en `.env` y **reiniciá `next dev`**.
2. Agregá un producto al carrito y entrá a `/checkout`. "Tarjeta o Mercado Pago" tiene que aparecer preseleccionado.
3. Confirmá el pedido y tocá **Pagar con Mercado Pago**.

En el checkout de MP usá una tarjeta ficticia. **El resultado lo decide el nombre del titular, no la tarjeta:**

| Tarjeta | Número | CVV | Vto |
|---|---|---|---|
| Visa crédito | 4509 9535 6623 3704 | 123 | 11/30 |
| Mastercard crédito | 5031 7557 3453 0604 | 123 | 11/30 |
| Amex | 3711 803032 57522 | 1234 | 11/30 |

| Titular | Resultado | Adónde vuelve |
|---|---|---|
| `APRO` | aprobado | `/checkout/exito`, pedido pasa a *Pago acreditado* |
| `CONT` | pendiente | `/checkout/pendiente` |
| `OTHE` | rechazado | `/checkout/fallo`, con botón de reintentar |
| `FUND` | fondos insuficientes | `/checkout/fallo` |

DNI: `12345678`.

### Por qué funciona sin webhook

Mercado Pago no puede alcanzar `localhost`, así que la notificación nunca llega. Por eso el pago **también se sincroniza al volver del checkout**: `MercadoPagoReturn` consulta el pago contra la API de MP y actualiza el pedido. Es lo que hace probable el flujo sin levantar un túnel.

La contracara: `isPubliclyReachable()` detecta que `NEXT_PUBLIC_BASE_URL` apunta a localhost y **omite `notification_url` y `auto_return`** de la preferencia. Si no se omitieran, MP rechazaría la preferencia entera.

### Probar el webhook de verdad

Hace falta una URL pública con HTTPS:

```bash
ngrok http 3000
```

Después, en el panel de MP → **Webhooks**:

- URL: `https://TU-TUNEL.ngrok.app/api/mercadopago/webhook`
- Eventos: **Pagos** (`payment`). El resto los ignora con `200`.

Guardás, copiás la clave secreta a `MERCADOPAGO_WEBHOOK_SECRET`, y **actualizás `NEXT_PUBLIC_BASE_URL` con la URL del túnel** — de ahí salen las `back_urls` y la `notification_url`.

El panel tiene un **simulador de notificaciones** para disparar eventos sin pagar.

---

## Decisiones que conviene conocer antes de tocar esto

### No se confía en lo que llega

Ni el cuerpo del webhook ni los parámetros de la URL de retorno se usan como verdad: solo dicen *qué pago mirar*. El estado sale siempre de consultar `GET /v1/payments/:id`. Los query params los controla el navegador.

### El webhook no repone stock

**Esto se aparta de lo que se había planificado, y es a propósito.**

Checkout Pro deja reintentar tras un rechazo, así que sobre un mismo pedido conviven varios pagos. Si se cancelara el pedido y se repusiera stock ante el primer `rejected`:

- se le saca el stock al comprador que está reintentando con otra tarjeta;
- y si ese reintento aprueba, queda un pedido pagado sin stock reservado.

Entonces `rejected` y `cancelled` solo marcan `paymentStatus = REJECTED`, y el pedido sigue en `PENDING_PAYMENT`. Reponer stock queda en el botón **"Cancelar y reponer stock"** de `/admin/pedidos/[id]`, que ya existía para los pedidos abandonados.

### Protecciones contra avisos fuera de orden

- Un pago aprobado **no pisa** un pedido que el admin ya movió a `PROCESSING` o `SHIPPED`: solo promueve a `PAID` si seguía en `PENDING_PAYMENT`.
- El aviso tardío de un intento fallido **no puede bajar** un pedido ya acreditado. Si `paymentStatus` es `APPROVED`, solo lo cambia una devolución.
- `refunded` y `charged_back` marcan `REFUNDED` pero **no** cambian el estado del pedido ni reponen stock: una devolución sobre un pedido ya entregado la resuelve el admin.

### La firma se calcula solo sobre `data.id`

El manifiesto que se firma es `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, y
Mercado Pago **omite** los campos que no vinieron en la notificación. El formato
IPN viejo manda `?topic=merchant_order&id=123` — sin `data.id` —, así que MP firma
sin el `id`.

Por eso `signatureDataId` sale únicamente de `data.id` y se pasa `null` cuando no
está: el SDK omite el campo y la firma coincide. Usar el `id` de la query como
respaldo (que es lo que se hacía antes) rechazaba con `401` toda notificación que
no fuera un webhook moderno, y MP las reintenta durante días.

Para *buscar* el pago sí se usan las tres fuentes: `data.id`, `id` y el cuerpo.

> El ejemplo sin SDK de la documentación pasa el id a minúsculas; el SDK oficial
> no. Se sigue al SDK. Para `payment`, el único tópico que se procesa, el id es
> numérico y da lo mismo.

### Códigos de respuesta del webhook

| Situación | Respuesta | Por qué |
|---|---|---|
| Firma inválida o ausente | `401` | |
| Topic que no es `payment` | `200` | Un error haría que MP reintente durante días |
| Pago que no corresponde a un pedido nuestro | `200` | No hay nada que reintentar |
| Falla la API de MP o la base | `500` | Acá sí queremos que MP reintente |

### Otros detalles

- La preferencia se crea **desde el server component**, no desde una API route: no hace falta un fetch del cliente. Por eso no existe `/api/mercadopago/preference`.
- `getOrderCheckoutUrl()` reutiliza la preferencia guardada en `Order.mpPreferenceId` y solo crea una nueva si MP ya no la reconoce (pasa al cambiar credenciales de test por las de producción).
- Cada sincronización que **cambia algo** deja un asiento en `OrderEvent` (ver
  `src/lib/order-events.ts`), con el actor `webhook` o `return` según de dónde
  vino. Los avisos que no mueven nada no escriben: MP notifica varias veces por
  pago y la sincronización es idempotente.
- El **descuento por transferencia no aplica** a Mercado Pago: se cobra el total.
- El **envío no va en la preferencia** salvo que el admin ya lo haya cargado (caso de un pago retomado más tarde). Se cotiza después de la compra.

---

## Pasar a producción

1. Panel de MP → **Producción → Credenciales de producción** (pide completar datos de la cuenta). Reemplazar `MERCADOPAGO_ACCESS_TOKEN` por la `APP_USR-...` real.
2. `NEXT_PUBLIC_BASE_URL` con el dominio real y HTTPS. Sin esto no se manda `notification_url` y **los pagos no se notifican**.
3. Panel → **Webhooks** con `https://DOMINIO/api/mercadopago/webhook`, evento **Pagos**. Copiar la clave secreta **de producción** (es distinta de la de prueba) a `MERCADOPAGO_WEBHOOK_SECRET`.
4. Verificar con una compra real de monto chico que el pedido llega a *Pago acreditado*.

> Las credenciales de prueba y las de producción no se mezclan: una preferencia creada con un token de test no se puede pagar con credenciales productivas.

---

## Referencias

- [Credenciales](https://www.mercadopago.com.mx/developers/es/docs/your-integrations/credentials)
- [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks)
- [Tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards)
- [Cuentas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/your-integrations/test/accounts)
- [MCP Server de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/mcp-server/overview) — configurado en `.mcp.json`, se activa con `/mcp`
