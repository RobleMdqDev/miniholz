# Plan: navegación, páginas de contenido y SEO

Escrito el 2026-09-18. **Parcialmente implementado el 2026-09-21** (ver "Estado de
avance").

Cubre cuatro cosas que llegaron juntas en un mismo pedido: arreglar el desplegable
del menú, convertirlo en un mega-menú con más contenido, crear las páginas de
contenido que faltan, y empezar una política de SEO.

---

## Estado de avance

| # | Entrega | Estado |
|---|---|---|
| 1 | Arreglo del desplegable + accesibilidad | ✅ hecho |
| 3 | SEO fase 1 (metadataBase, robots, sitemap, metadata por página) | ✅ hecho |
| 5 | SEO fase 2 (JSON-LD) | ✅ hecho, salvo `FAQPage` |
| 6 | Rutas reales de categoría | ✅ hecho |
| 7 | Novedades | ✅ hecho |
| 2 | Páginas de contenido | ⛔ bloqueado: faltan los textos del negocio |
| 4 | Mega-menú con contenido | ⏳ depende de 2 |
| 8 | SEO fases 4 y 5 | ⏳ pendiente |

De las seis rutas en 404 de la sección 0, `/novedades` ya existe. **Las otras cinco
siguen en 404**: crearlas es la entrega 2 y necesita contenido real, así que el
sitemap todavía no las lista.

---

## 0. Hallazgo previo: cinco páginas enlazadas no existen

Antes que nada, esto:

```
/quienes-somos                       404
/como-comprar                        404
/contacto                            404
/ayuda                               404
/politica-de-cambios-y-devoluciones  404
/novedades                           404
```

`Header.tsx` (`NAV_LINKS_AFTER`, el enlace de Ayuda) y el pie enlazan esas rutas.
**Toda la navegación secundaria del sitio lleva a 404.**

No es solo una molestia de navegación: para SEO es de lo peor que puede pasar.
Google sigue los enlaces internos, se come los 404 y los toma como señal de sitio
descuidado. Además diluye el *link equity* interno en destinos muertos.

Esto cambia el orden del trabajo: **crear esas páginas es más urgente que agrandar
el menú**, porque hoy el menú promete contenido que no existe.

---

## 1. El desplegable se cierra al pasar el mouse — ✅ resuelto

> Implementado en `src/components/layout/NavDropdown.tsx`: se aplicó el arreglo
> geométrico (`py-3 -my-3`), el cierre diferido de 120 ms cancelable, y los cuatro
> puntos de accesibilidad. El botón pasó a alternar y se quitó el `onFocus` que
> abría: el foco se dispara antes que el click, así que con un botón que alterna
> el click lo habría cerrado de inmediato. Verificado en el navegador.

### Diagnóstico

Está en `src/components/layout/NavDropdown.tsx` combinado con `Header.tsx`.

El panel se posiciona con `absolute left-1/2 top-full w-screen`, pero su ancestro
posicionado no es el disparador sino el `<nav className="relative">` del header.
Esto es correcto y deliberado: es lo que permite que el panel ocupe todo el ancho
de la página en vez del ancho del botón.

El problema es que los manejadores de hover (`onMouseEnter` / `onMouseLeave`) están
en el `<div>` del disparador, cuya altura es la del botón. El contenedor interno del
`<nav>` tiene `py-3`, así que **entre el borde inferior del botón y el borde superior
del panel hay una zona muerta de unos 12px**. Al bajar el mouse hacia el panel se
cruza esa zona, el puntero sale del `<div>`, se dispara `onMouseLeave` y el panel se
cierra antes de llegar.

### Arreglo propuesto

Extender el área sensible del disparador hasta cubrir el alto completo de la fila,
con `py-3 -my-3` en el `<div>`. Así su borde inferior coincide con el del `<nav>`,
que es donde arranca el panel, y desaparece la zona muerta. No requiere temporizadores
ni cambiar el posicionamiento.

Complemento recomendado: un cierre diferido de ~120ms cancelable, para el movimiento
diagonal (salir por el costado del botón y entrar al panel más abajo). Es el patrón
estándar de los mega-menús y cubre el caso que el arreglo geométrico no cubre.

### Accesibilidad, que hoy está a medias

- `onClick={() => setOpen(true)}` solo abre: el botón no alterna, así que con teclado
  o touch no hay forma de cerrarlo salvo el click afuera.
- Falta `aria-haspopup` y `aria-controls`.
- El foco no entra al panel ni vuelve al botón con `Escape`.
- En móvil el desplegable no se usa (está el `MobileMenu`), pero el botón igual
  aparece en el DOM del `<nav>` oculto con `hidden md:block`.

Vale arreglarlo en la misma pasada: es el mismo archivo y son pocas líneas.

---

## 2. Mega-menú con más contenido

### Qué hace la referencia

En `nishito.com.ar` el panel de "Tienda Online" es a todo el ancho y tiene **cuatro
columnas**:

| Columna | Contenido |
|---|---|
| 1 | Promos destacadas, en color de acento (`PRIMAVERA-VERANO 40% OFF`, `SALE 40% & 50% OFF`, …) |
| 2 y 3 | Un encabezado de grupo (`Invierno`, `Verano`) y debajo sus subcategorías |
| 4 | Más promos destacadas |

Su barra superior además tiene más entradas que la nuestra: Inicio, Tienda Online,
Quiénes Somos, Cómo Comprar, Política de cambios y devoluciones, Tabla de Talles,
Contacto, Novedades.

### El obstáculo: hoy no hay jerarquía de categorías

`storeCategories` es una lista plana de cinco: *decoracion, guardado, mesas-y-sillas,
organizacion, percheros*. El modelo `Category` no tiene padre ni hijos.

Para columnas con encabezado hacen falta dos niveles. Tres caminos:

| Opción | Qué implica | Cuándo conviene |
|---|---|---|
| **A. Agrupación curada en código** | Un mapa `grupo → categorías` en un archivo de configuración. Sin migración. | Si las categorías van a ser pocas y estables. Es lo más rápido y honesto para cinco categorías. |
| **B. `parentId` en `Category`** | Migración, ABM de categorías anidadas en el admin, y la tienda pasa a soportar dos niveles. | Si el catálogo va a crecer y querés administrarlo sin tocar código. |
| **C. Sin agrupar** | Una sola columna de categorías + columnas de promos y productos destacados. | Si preferís no inventar una jerarquía que el catálogo todavía no tiene. |

**Recomendación: C ahora, B cuando el catálogo lo pida.** Con cinco categorías,
partirlas en grupos es una jerarquía decorativa. El panel puede ganar contenido real
por otro lado: promos, productos destacados con imagen, y accesos directos a
*Novedades* y *Cómo Comprar*.

### Contenido propuesto para el panel

1. **Columna de categorías** — las cinco actuales.
2. **Columna de accesos** — *Todos los productos*, *Novedades*, *Personalizados*.
3. **Columna de promos** — texto configurable desde `/admin/configuracion`, no
   hardcodeado, para que puedan cambiar una campaña sin deploy.
4. **Bloque de destacados** — dos o tres productos con imagen. Aporta enlaces internos
   hacia fichas de producto, que es exactamente lo que ayuda al SEO.

Las promos configurables implican agregar campos a `StoreSettings`. Es una decisión
a tomar: sin eso, cambiar una promo es un deploy.

### Barra superior

Agregar *Política de cambios y devoluciones* y *Novedades*, como la referencia.
*Tabla de Talles* no aplica al rubro.

---

## 3. Páginas de contenido

Seis rutas nuevas bajo `src/app/(store)/`.

| Ruta | Qué lleva |
|---|---|
| `/quienes-somos` | Historia del taller, cómo se fabrica, materiales, fotos |
| `/como-comprar` | Pasos de compra, medios de pago, plazos de producción y envío, personalización |
| `/politica-de-cambios-y-devoluciones` | Plazos, condiciones, botón de arrepentimiento, cómo iniciar un cambio |
| `/contacto` | Formulario, WhatsApp, mail, redes, horarios |
| `/ayuda` | Preguntas frecuentes |
| `/novedades` + `/novedades/[slug]` | Notas y novedades |

### Dos decisiones que hay que tomar antes de escribir una línea

**Quién es dueño del contenido: ¿código o base de datos?**

- *En código* (TSX o MDX): más simple, más rápido, mejor para SEO, versionado en git.
  Cambiar un texto es un deploy.
- *En la base*, editable desde `/admin`: autonomía total para el cliente, pero hay que
  construir el editor, y es mucho más trabajo.

Recomiendo **código para las cinco primeras** (cambian poco) y **base de datos para
Novedades** (que por definición cambia seguido y necesita ABM).

**El contenido real lo tienen que dar ustedes.** Yo puedo armar la estructura, la
maqueta y los textos de relleno, pero:

- La **política de cambios y devoluciones tiene efectos legales**. En Argentina rige la
  Ley 24.240 y la Resolución 424/2020 exige el *botón de arrepentimiento* visible, con
  10 días corridos para compras a distancia. No voy a redactar eso por mi cuenta: hace
  falta que lo definan y, idealmente, que alguien con criterio legal lo revise.
- Plazos de producción, costos y zonas de envío, horarios y datos de contacto son datos
  del negocio. Inventarlos sería peor que dejar la página para después.

### Novedades, que es un proyecto aparte — ✅ hecho

> Implementado. El modelo `Post` (migración `agrega_novedades`), el ABM en
> `/admin/novedades`, el listado paginado en `/novedades` y la ficha en
> `/novedades/[slug]`, con `BlogPosting` + `BreadcrumbList` y las notas publicadas
> en el sitemap. Decisiones que conviene conocer:
>
> - **El cuerpo se guarda en Markdown**, no en HTML, y se renderiza con
>   `react-markdown` **sin** `rehype-raw`. Eso es lo que hace que el texto que
>   escribe el admin no pueda inyectar marcado en la página: un `<script>` en el
>   cuerpo sale como texto visible, no como etiqueta. Si algún día hace falta HTML
>   dentro de una nota, la respuesta no es habilitar `rehype-raw` sino sanitizar.
> - **La tienda nunca ve un borrador.** El filtro no se repite en cada consulta,
>   vive en `publishedWhere()` dentro de `src/lib/posts.ts`, para que agregar una
>   consulta nueva no sea una oportunidad de olvidárselo. Filtra por estado y
>   también por fecha, así que una nota se puede dejar programada.
> - **`publishedAt` se sella al publicar por primera vez** y no se vuelve a tocar,
>   ni siquiera al despublicar y volver a publicar: si se borrara, una nota vieja
>   reaparecería al tope del listado como si fuera nueva.
> - **La portada se sube al storage propio** en vez de aceptar una URL pegada:
>   `next/image` solo optimiza los dominios declarados en `next.config.ts`, y una
>   URL externa daría 400 en producción.
>
> Lo que **no** quedó probado con clicks: el formulario del panel. Entrar exige una
> sesión de admin, y para eso hay que tipear una contraseña. Conviene que alguien
> cree una nota de punta a punta antes de darlo por cerrado.

El diagnóstico original decía: no es una página, es un modelo de contenido. Necesita modelo `Post` en Prisma (slug,
título, bajada, cuerpo, portada, estado, fecha de publicación), migración, ABM en el
admin, editor de texto enriquecido o MDX, listado paginado y ficha con su metadata.

**Es el ítem más grande de todo este plan, y también el de mayor retorno en SEO**, por
ser la única fuente de contenido nuevo y indexable de forma sostenida. Sugiero tratarlo
como una entrega propia y no mezclarlo con el resto.

---

## 4. Política de SEO

### Punto de partida

Hay título con plantilla (`%s | MiniHolz`) y una descripción por defecto. Nada más:

```
✗ metadataBase          ✗ sitemap.ts       ✗ robots.ts
✗ OpenGraph / Twitter   ✗ JSON-LD          ✗ canonical
✗ metadata por producto ✗ breadcrumbs
```

### Fase 1 — Base técnica — ✅ hecha

Sin esto, lo demás no rinde.

1. ✅ **`metadataBase`** en el layout raíz, desde `NEXT_PUBLIC_BASE_URL` (vía
   `siteUrl()` en `src/lib/site.ts`, que ahora es la única fuente del dominio: antes
   la misma lógica vivía suelta en `mercadopago.ts`).
2. ✅ **`app/robots.ts`** — todo permitido salvo `/admin`, `/cuenta`, `/checkout`,
   `/carrito`, `/login`, `/registro` y `/api`, con el sitemap declarado.
3. ✅ **`app/sitemap.ts`** con `revalidate = 3600`: inicio, listado, las cinco
   categorías y los productos activos con su `updatedAt` y su primera imagen. La
   revalidación importa porque `sitemap.ts` es un Route Handler cacheado — sin ella
   un producto nuevo no aparecería hasta el siguiente deploy, y el catálogo lo edita
   el admin, no el repositorio.
4. ✅ **Metadata por página.** Corrección al diagnóstico original: las fichas de
   producto **sí** tenían `generateMetadata` con título y descripción; lo que les
   faltaba era la canónica y OpenGraph. El problema real de títulos duplicados
   estaba en el **listado**, donde las cinco categorías compartían "Tienda online".
   Ahora cada filtro conocido tiene título, descripción y canónica propios, y un
   parámetro inventado canoniza al listado completo.
5. ⚠️ **Imágenes para compartir**: cada producto usa su propia foto y el resto del
   sitio el logo. Queda pendiente **diseñar una pieza de 1200×630**, que es la
   proporción que prefieren las redes; hoy el logo es cuadrado y lo recortan.
   Se cambia en un solo lugar (`SITE_OG_IMAGE`).

> Nota de implementación, por si toca volver acá: la metadata se hereda hacia abajo
> y se mezcla de forma **superficial**. Por eso la canónica **no** puede ir en el
> layout raíz (todas las páginas apuntarían al inicio) y por eso `openGraph` y
> `twitter` se arman juntos desde `socialMetadata()`: declarar uno y olvidarse del
> otro deja las tarjetas de X con el nombre y el logo del sitio en vez de los del
> producto. Pasó durante esta misma implementación.

### Fase 2 — Datos estructurados (JSON-LD) — ✅ hecha

Los objetos viven en `src/lib/json-ld.ts` y los renderiza `src/components/seo/JsonLd.tsx`.

| Esquema | Dónde | Estado |
|---|---|---|
| `Organization` | layout de la tienda | ✅ |
| `WebSite` | layout de la tienda | ✅ **sin** `SearchAction` (ver abajo) |
| `Product` + `Offer` / `AggregateOffer` | ficha de producto | ✅ |
| `BreadcrumbList` | producto y categoría | ✅ |
| `FAQPage` | ayuda y cómo comprar | ⛔ depende de la entrega 2 |

Tres decisiones que conviene no revertir sin pensarlas:

- **`Organization`, no `LocalBusiness`.** No hay dirección física ni horario de
  atención, y un `LocalBusiness` sin dirección es marcado inválido. Si algún día hay
  local o punto de retiro, cambia ahí.
- **Sin `SearchAction`.** El buscador del header es hoy un input decorativo: no tiene
  formulario, ni nombre de parámetro, ni ruta de resultados. Declarar una URL de
  búsqueda que no busca nada es justo el tipo de marcado que Google castiga. Se
  agrega cuando exista la búsqueda — y vale la pena: es la caja de búsqueda dentro
  del propio resultado de Google.
- **`AggregateOffer` cuando las variantes tienen precios distintos.** Tres de los
  ocho productos están en ese caso. Declarar un precio único haría que el resultado
  de búsqueda muestre un valor que el visitante después no encuentra en la página.

Faltan, a propósito, `priceValidUntil`, `shippingDetails` y `hasMerchantReturnPolicy`:
Google los recomienda, pero hoy no hay con qué completarlos sin inventar. Los dos
últimos se destraban justo con lo que ya está en agenda — la página de cambios y
devoluciones (entrega 2) y la cotización de envíos (ver `plan-modo-y-envios.md`).
Tampoco hay `aggregateRating` ni `review`: no existen reseñas, y fabricarlas puede
costar los resultados enriquecidos del sitio entero.

> **Nota de seguridad, que no es opcional.** `JSON.stringify` no escapa nada y el
> nombre y la descripción de un producto los edita el admin: un `</script>` metido
> ahí cerraría la etiqueta y lo que siguiera correría como HTML. `JsonLd` reemplaza
> `<` por `<`, que lo neutraliza sin cambiar el valor que lee el buscador. Si
> alguien toca ese componente, esa línea se queda.

### Fase 3 — Arquitectura de URLs — ✅ hecha

> Implementado en `src/app/(store)/productos/categoria/[slug]/page.tsx`, con
> `generateStaticParams` sobre las categorías. Cada una tiene ahora su `h1`, su
> texto introductorio, su metadata y su `BreadcrumbList`.
>
> - **El parámetro sigue vivo pero ya no lo enlaza nadie.** `/productos?categoria=x`
>   filtra igual —no se rompen URLs compartidas, favoritos ni lo que los buscadores
>   ya indexaron— pero canoniza a la ruta limpia. Todos los enlaces internos
>   (header, mega-menú, menú móvil, carrusel del inicio, chips y migas de la ficha
>   de producto) apuntan a la ruta real: una categoría enlazada de dos formas
>   reparte su propio peso entre las dos.
> - **El sitemap lista las rutas limpias**, no las del parámetro. Declarar en el
>   sitemap una URL que canoniza a otra manda señales contradictorias.
> - **Si en algún momento se prefiere cortar por lo sano**, el paso siguiente es
>   redirigir `?categoria=` a la ruta limpia con un 308 en vez de canonizar. Es más
>   fuerte —consolida al instante en vez de pedirle a Google que respete la
>   canónica— y hoy no se perdería nada, porque no hay otros filtros. Se dejó la
>   canónica porque el plan preveía filtros combinados sobre el listado.
> - **Los textos introductorios los redacté yo** a partir del catálogo, en
>   `src/lib/category-copy.ts`. Son descriptivos y no prometen plazos, precios ni
>   materiales que no estén ya en las fichas, pero **hay que revisarlos**: es la voz
>   de la marca la que habla ahí. Viven en código siguiendo el criterio de la
>   sección 3 (código para lo que cambia poco); si se quieren editar sin deploy, el
>   movimiento es pasarlos a `Category.description`.

### El diagnóstico original

**Las categorías hoy son un parámetro: `/productos?categoria=mesas-y-sillas`.**

Los buscadores tratan mal los parámetros de filtrado: no los indexan bien, generan
contenido duplicado y compiten entre sí. Una categoría que debería rankear por
"mesas infantiles de madera" hoy no tiene una URL propia que posicionar.

Propuesta: rutas reales `/productos/categoria/[slug]`, con su `h1`, su texto
introductorio y su metadata. Mantener el parámetro para filtros combinados, pero con
`canonical` apuntando a la ruta limpia.

Implica tocar los enlaces del header, el mega-menú y el listado. No es trivial, pero
es la diferencia entre tener cinco páginas que pueden posicionar y no tener ninguna.

### Fase 4 — Contenido y rendimiento

- **Un solo `h1` por página**, con jerarquía coherente. Auditar las existentes.
- **`alt` descriptivo en todas las imágenes.** Hoy el logo repite "MiniHolz" en varios
  lugares y las imágenes de producto habría que revisarlas una por una.
- **Core Web Vitals**: el carrusel del inicio es casi con seguridad el LCP. Verificar
  `priority`, tamaños y que no haya salto de layout.
- **Textos con intención de búsqueda** en las categorías. Sin texto propio, una página
  de categoría es una grilla de imágenes que no le dice nada a Google.

### Fase 5 — Medición, que es de ustedes

Nada de lo anterior se puede evaluar sin esto:

1. Alta en **Google Search Console** y verificación del dominio.
2. Enviar el sitemap.
3. Alta en **Google Business Profile** si hay atención presencial o retiro.
4. Opcional: Vercel Analytics y Speed Insights.

> **Un aviso honesto sobre expectativas.** "Primeras posiciones en los buscadores" no es
> algo que se consiga con cambios técnicos. Lo técnico saca los obstáculos —y acá hay
> varios, empezando por seis páginas en 404 y las fichas de producto sin metadata
> propia—, pero posicionar depende después de contenido sostenido, antigüedad del
> dominio y enlaces entrantes. Un dominio nuevo en `vercel.app` parte de cero, y vale
> la pena señalar que **un dominio propio pesa más que uno de `vercel.app`**: si la meta
> es posicionar, comprarlo es de las primeras cosas a hacer.

---

## Orden sugerido

| # | Entrega | Depende de | Tamaño |
|---|---|---|---|
| ~~1~~ | ~~Arreglo del desplegable + accesibilidad~~ ✅ | — | Chico |
| 2 | Las cinco páginas de contenido (maqueta + textos de ustedes) | Contenido del negocio | Mediano |
| ~~3~~ | ~~SEO fase 1~~ ✅ (se adelantó a la 2: el sitemap simplemente no lista lo que todavía no existe) | — | Mediano |
| 4 | Mega-menú con contenido | 2, para tener adónde enlazar | Mediano |
| ~~5~~ | ~~SEO fase 2 (JSON-LD)~~ ✅ salvo `FAQPage`, que depende de la 2 | 3 | Chico |
| ~~6~~ | ~~Rutas reales de categoría~~ ✅ (no hizo falta esperar a la 4) | 4 | Mediano |
| ~~7~~ | ~~Novedades (modelo, ABM, listado, ficha)~~ ✅ | — | **Grande, entrega propia** |
| 8 | SEO fases 4 y 5 (auditoría, CWV, Search Console) | Todo lo anterior | Continuo |

El arreglo del desplegable (#1) se puede hacer ya mismo y por separado: no depende de
ninguna decisión.

---

## Lo que necesito de ustedes para arrancar

1. **Textos y datos** de las cinco páginas, sobre todo la política de cambios y
   devoluciones.
2. **Decisión** sobre contenido en código o en base de datos.
3. **Decisión** sobre la jerarquía de categorías (opción A, B o C de la sección 2).
4. **Decisión** sobre promos del mega-menú configurables desde el admin.
5. **Dominio propio**, si la meta es posicionar en serio.
