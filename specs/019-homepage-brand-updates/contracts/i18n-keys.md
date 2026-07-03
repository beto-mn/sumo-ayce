# Contract: i18n Copy (key ↔ ES/EN value)

This is the copy contract for feature 019. ES = client verbatim; EN = approved translation.
Every string MUST match exactly (punctuation, accents, "·", "—", "..."). Source of truth:
`../client-brief.md`.

## Hero — `HomeHero.vue`

| Key | ES | EN |
|-----|----|----|
| `home.hero.headline` (unchanged) | `All You Can Eat` | `All You Can Eat` |
| `home.hero.kicker` | `Come sin límites · Buffet preparado al instante` | `Eat without limits · Buffet made to order` |
| `home.hero.subtitle` | `Más de 45 platillos por un solo precio... Descubre tu nuevo lugar favorito.` | `45+ dishes for a single price... Discover your new favorite place.` |
| `home.hero.logoAlt` (unchanged) | `SUMO — All You Can Eat` | `SUMO — All You Can Eat` |

## Marquee — `SiteMarquee.vue` (`home.marquee` array, order matters)

| # | ES | EN |
|---|----|----|
| 1 | `Sushi` | `Sushi` |
| 2 | `Boneless` | `Boneless` |
| 3 | `Smash Burgers` | `Smash Burgers` |
| 4 | `Yakimeshi` | `Yakimeshi` |
| 5 | `Sumo Sandwich` | `Sumo Sandwich` |
| 6 | `Hot Dogs` | `Hot Dogs` |
| 7 | `$269 todos los días` | `$269 every day` |

## Homepage SEO — `index.vue` (new keys)

| Key | ES | EN |
|-----|----|----|
| `home.seo.title` | `Sumo All You Can Eat \| Buffet de sushi y comida americana` | `Sumo All You Can Eat \| Sushi & American Food Buffet` |
| `home.seo.description` | `Disfruta de tu buffet Sumo y menú a la carta con sushi, hamburguesas, boneless y más. Vive la experiencia en nuestras más de 30 sucursales en CDMX, EDOMEX y Cuernavaca.` | `Enjoy your Sumo buffet and à la carte menu with sushi, burgers, boneless and more. Live the experience at our 30+ locations across CDMX, EDOMEX and Cuernavaca.` |

## Type Selector — `HomeTypeSelector.vue`

| Key | ES | EN |
|-----|----|----|
| `home.typeSelector.kicker` | `AYCE - EXPRESS` | `AYCE - EXPRESS` |
| `home.typeSelector.title` | `Dos experiencias, la misma garantía Sumo.` | `Two experiences, the same Sumo guarantee.` |
| AYCE card prominent title | `All You Can Eat` | `All You Can Eat` |
| `home.typeSelector.ayce.desc` | `La experiencia completa para disfrutar sin límites: buffet, variedad de platillos a la carta y el sabor sumo que ya conoces.` | `The complete experience to enjoy without limits: buffet, a variety of à la carte dishes and the Sumo flavor you already know.` |
| Express card prominent title | `Express` | `Express` |
| `home.typeSelector.express.desc` | `La opción práctica y rápida para disfrutar tus favoritos de Sumo de forma más ágil, sin perder sabor ni calidad (con platillos exclusivos).` | `The quick, practical option to enjoy your Sumo favorites in a nimbler way, without losing flavor or quality (with exclusive dishes).` |

> The prominent titles are achieved by re-mapping the existing `name`/`badge` keys — no new
> card component. The visible result MUST be "All You Can Eat" (AYCE) and "Express".

## Featured Rail — `HomeFeaturedRail.vue`

| Key | ES | EN |
|-----|----|----|
| `home.featured.title` (label) | `Los favoritos de nuestros clientes` | `Our customers' favorites` |
| `home.featured.heading` (NEW) | `Garantía Sumo` | `Sumo Guarantee` |
| `home.featured.subtitle` | `Amado y recomendado por nuestros clientes` | `Loved and recommended by our customers` |

## Branches CTA — `HomeBranchesCta.vue`

| Key | ES | EN |
|-----|----|----|
| `home.branches.title` | `Más de 30 sucursales en CDMX, EDOMEX y Cuernavaca` | `30+ locations across CDMX, EDOMEX and Cuernavaca` |

## Footer — `SiteFooter.vue`

| Key | ES | EN |
|-----|----|----|
| `footer.brand.blurb` | `Sumo All You Can Eat es el buffet en donde encontrarás sushi, alitas, hamburguesas, ramen y mucho más, todo preparado al instante y con una gran variedad de bebidas y promociones para ofrecer una experiencia llena de sabor, variedad y diversión, tú eliges si es en familia, con amigos o en pareja.` | `Sumo All You Can Eat is the buffet where you'll find sushi, wings, burgers, ramen and much more, all made to order and with a great variety of drinks and promotions for an experience full of flavor, variety and fun — you choose whether it's with family, friends or your partner.` |

## Site-wide tagline

| Key | ES | EN |
|-----|----|----|
| `brand.tagline` | `Buffet preparado al instante` | `Buffet made to order` |
| `footer.brand.tagline` | `Buffet preparado al instante` | `Buffet made to order` |

> No occurrence of `Estilo americano-japonés` / `American-Japanese style` may remain.

## Page titles (H1 + SEO/tab)

| Page | Keys | ES | EN |
|------|------|----|----|
| Branches (`branches.vue`) | `branches.page.heading` + `branches.page.title` | `Sucursales Sumo` | `Sumo Branches` |
| Promotions (`promotions.vue`) | `promotions.page.heading` + `promotions.seo.title` | `Promociones Sumo` | `Sumo Promotions` |
| Reserve (`reserve.vue`) | H1 + `reservation.page_title` | `Reservas Sumo` | `Sumo Reservations` |

## Menu drinks label

| Key | ES | EN |
|-----|----|----|
| `menu.category.drinks` | `Bebidas y coctelería` | `Drinks & cocktails` |

> Seed alignment: `server/db/seeds/menuCategories.ts` drinks `nameEs` → `Bebidas y coctelería`,
> `nameEn` → `Drinks & cocktails`. No migration.
