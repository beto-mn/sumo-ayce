# Intake — lote de cambios (2026-07-08)

Origen: solicitud del cliente en chat. Mapeado contra código real (menu-map.md, homepage-map.md, contact-map.md).

## Hallazgos clave del código
- **Menú**: DB Neon. Comida = 17 categorías PLANAS (sin subcategorías). Solo bebidas tienen 2 niveles (drinkGroups → drinkSubGroups). `beers_spirits` agrupa cervezas + destilados (13 subgrupos).
- **Vaso Sumo**: 5 items separados (Ron/Tequila/Vodka/Whisky/New Mix), mismo `sumo_cup.webp`, $159 (New Mix incluido). Cantarito Fest es aparte (tiene sabores en descripción).
- **Caguamón**: item en subgrupo `caguamon`.
- **Promo "2x1 / Combo Mezcladores $189"**: vive en `drinkSubGroup.subtitleEs/promoEs`, repetido por cada subgrupo de destilado.
- **Garantías Sumo (featured)**: DB-driven vía `menu_items.featured=true` + `displayOrder`. Los 11 nombres matchean (ojo: "Burger del Barrio", no "de barrio").
- **Hero headline**: usa **Titan One** (no Anton). `.hero-headline` en base.css + preload en nuxt.config.
- **Promociones**: YA vienen de WordPress `cms.sumo.com.mx/wp-json/wp/v2/promociones` vía `/server/api/v1/content/promotions.get.ts`. Hoy 1 sola imagen (`acf.imagen`). Grid, NO carrusel. Sin librería de slider instalada.
- **Contacto**: `ContactInfo.vue` panel derecho; card nueva = nueva `<section>` + keys `contact.*`.
- **Modality "carta"** i18n = "À la carte" (es y en).

## Decomposición APROBADA (4 features)
- **021 — Menú (datos + UI)**: subcategorías/nivel-padre, split Destilados, Vaso Sumo variantes (selector), reorden caguamón, orden café/digestivos, quitar salsas alitas, Garantías Sumo 11 featured, hover zoom, categoría default, "Carta", cards medio-ancho sin imagen.
- **022 — Hero headline font** Titan One → Graphik-Super.
- **023 — Promotions carousel (Embla) + WP 3 imágenes**.
- **024 — Contact: card Bolsa de trabajo** (solo texto + tel CTA).

## Decisiones tomadas
- Embla para carrusel. Vaso Sumo = selector tipo salsas. Contacto = solo texto + tel.
- Garantías Sumo: 11 nombres matchean (seed dice "Burger del Barrio").
- Categorías comida actuales (15) y grupos bebida (6) ya existen — se pide agregar nivel PADRE encima.

## Taxonomía CONFIRMADA (contrato para 021)
Selector primario 3-vías: **AYCE | Express | Bebidas y coctelería**.
- **AYCE** → modalidad **All You Can Eat** | **Carta**, cada una con su set de categorías.
- **Express** → set único (sin modalidad).
- **Bebidas** → grupos de bebida.

Default de entrada: **AYCE → All You Can Eat → Entradas**. En Bebidas: **Coctelería Jumbo**.

**AYCE · All You Can Eat** (8): Entradas, Hamburguesas, Sándwiches, Hot Dogs, Sushi Frío, Sushi Caliente, Rollos Dulces, Alitas & Boneless.
**AYCE · Carta** (12): Entradas, Ensaladas, Arroz, Ramen, Hamburguesas, Hot Dogs, Sushi Frío, Sushi Caliente, Rollos Dulces, Postres, Alitas & Boneless, Menú Kids.
**Express** (8): Entradas, Hamburguesas, Burritos, Hot Dogs, Sushi Frío, Sushi Caliente, Rollos Dulces, Alitas & Boneless.
**Bebidas** (6): Coctelería Jumbo, Cantaritos y Vasos Sumo, Refrescos y Bebidas (+Sin Alcohol), Cervezas, Destilados (nuevo split), Café y Digestivos.

✅ Asimetrías CONFIRMADAS a propósito: Sándwiches solo en AYCE-buffet; Burritos solo en Express; Carta sin Sándwiches ni Burritos. Codificar literal.
✅ Medio ancho = card sin imagen ocupa la mitad de una con imagen (6/fila en desktop vs 3/fila).

## Decisiones adicionales
- WP ACF: `acf.imagen_desktop`, `acf.imagen_tablet`, `acf.imagen_movil`. Misma base URL que promociones actual.
- Cards sin imagen → medio ancho en TODAS las secciones de bebidas.
- Label "carta": es "Carta", en "Menu". buffet queda "All You Can Eat".
- Graphik-Super: licencia OK.

## Bloqueantes (esperando cliente)
1. Árbol completo de subcategorías (comida + bebidas).
2. WP: nombres de campos ACF para 3 imágenes + quién los configura.
3. Vaso Sumo: display (selector vs lista) + sabores exactos.
4. Categoría default por toggle.
5. Confirmar media-ancho para cards sin imagen.
6. Librería carrusel.
7. Contact: solo teléfono CTA o también formulario.
8. Licencia Graphik-Super.
