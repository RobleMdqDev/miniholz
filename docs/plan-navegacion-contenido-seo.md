# Plan: navegación, páginas de contenido y SEO

Estado: **propuesta, sin implementar**. Escrito el 2026-09-18.

Cubre cuatro cosas que llegaron juntas en un mismo pedido: arreglar el desplegable
del menú, convertirlo en un mega-menú con más contenido, crear las páginas de
contenido que faltan, y empezar una política de SEO.

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

## 1. El desplegable se cierra al pasar el mouse

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

### Novedades, que es un proyecto aparte

No es una página: es un modelo de contenido. Necesita modelo `Post` en Prisma (slug,
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

### Fase 1 — Base técnica

Sin esto, lo demás no rinde.

1. **`metadataBase`** en el layout raíz, desde `NEXT_PUBLIC_BASE_URL`. Sin esto, las
   URLs de OpenGraph y las canónicas salen relativas y los validadores las descartan.
2. **`app/robots.ts`** — permitir todo salvo `/admin`, `/cuenta`, `/checkout`, `/api`,
   y declarar el sitemap.
3. **`app/sitemap.ts`** dinámico: estáticas + productos activos + categorías, con
   `lastModified` real desde `updatedAt`.
4. **Metadata por página.** Hoy las fichas de producto no tienen `generateMetadata`:
   todas comparten título y descripción, que es el error de SEO más caro en un
   e-commerce. Cada producto necesita título, descripción propia y `alternates.canonical`.
5. **`opengraph-image`** por producto y una imagen por defecto para el resto.

### Fase 2 — Datos estructurados (JSON-LD)

| Esquema | Dónde | Para qué |
|---|---|---|
| `Organization` / `LocalBusiness` | layout | Panel de conocimiento, datos de contacto |
| `WebSite` + `SearchAction` | layout | Caja de búsqueda en Google |
| `Product` + `Offer` | ficha de producto | **Precio, stock y cuotas en el resultado de búsqueda** |
| `BreadcrumbList` | producto y categoría | Miga de pan en el resultado |
| `FAQPage` | ayuda y cómo comprar | Resultados enriquecidos |

El de `Product` es el de mayor impacto directo en clics.

### Fase 3 — Arquitectura de URLs

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
| 1 | Arreglo del desplegable + accesibilidad | — | Chico |
| 2 | Las cinco páginas de contenido (maqueta + textos de ustedes) | Contenido del negocio | Mediano |
| 3 | SEO fase 1 (metadataBase, robots, sitemap, metadata por producto) | 2, para que el sitemap no liste 404 | Mediano |
| 4 | Mega-menú con contenido | 2, para tener adónde enlazar | Mediano |
| 5 | SEO fase 2 (JSON-LD) | 3 | Chico |
| 6 | Rutas reales de categoría | 4 | Mediano |
| 7 | Novedades (modelo, ABM, listado, ficha) | — | **Grande, entrega propia** |
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
