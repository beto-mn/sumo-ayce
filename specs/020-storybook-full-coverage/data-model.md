# Data Model: Storybook Full UI/UX Documentation Coverage

**Feature**: 020-storybook-full-coverage  
**Date**: 2026-06-29

> This feature has no database schema changes. The "data model" here describes the
> structural contracts of the Storybook configuration and story file format — the
> artifacts this feature creates or modifies.

---

## Story File Anatomy (CSF3 pattern used throughout)

Every `.stories.ts` file in this project uses Component Story Format 3 (CSF3).

```ts
import type { Meta, StoryObj } from '@storybook/vue3'
import ComponentName from './ComponentName.vue'

// Meta object — one per file
const meta: Meta<typeof ComponentName> = {
  title: 'Slice/ComponentName',        // sidebar path
  component: ComponentName,
  tags: [],                             // ['autodocs'] only on ComponentDocs files
  argTypes: {
    propName: {
      description: 'What this prop does',
      control: { type: 'text' | 'boolean' | 'select' | 'number' | 'object' },
      options: ['value1', 'value2'],    // only for 'select' type
    },
    // ... one entry per prop
  },
}
export default meta

// Story type alias
type Story = StoryObj<typeof meta>

// Named story exports
export const Default: Story = {
  args: { /* prop values for default state */ },
}

export const Loading: Story = {
  args: { /* loading state props */ },
}
// ... other named stories
```

---

## ArgTypes Schema (per prop type)

| Prop TypeScript type | `control.type` | Notes |
|---|---|---|
| `boolean` | `'boolean'` | Renders as toggle checkbox |
| `string` | `'text'` | Renders as text input |
| `number` | `'number'` | Renders as number input |
| `'ayce' \| 'express'` (or other string union) | `'select'` + `options: [...]` | Renders as select dropdown |
| `object` | `'object'` | Renders as JSON editor |
| `string[]` or `array` | `'object'` | Renders as JSON editor |
| Function / event handler | omitted from `control` | Functions cannot be serialized; describe in `description` only |

---

## Storybook Config Entities

### `.storybook/main.ts` (modified)

| Field | Before | After |
|---|---|---|
| `addons` | `['@storybook/addon-docs']` | `['@storybook/addon-docs', '@storybook/addon-viewport', '@storybook/addon-a11y']` |
| `docs.autodocs` | `'tag'` | `true` |

### `.storybook/preview.ts` (created if absent)

| Field | Value |
|---|---|
| `parameters.viewport.viewports.mobile` | `{ name: 'Mobile (375px)', styles: { width: '375px', height: '812px' } }` |
| `parameters.viewport.viewports.tablet` | `{ name: 'Tablet (768px)', styles: { width: '768px', height: '1024px' } }` |
| `parameters.viewport.viewports.desktop` | `{ name: 'Desktop (1280px)', styles: { width: '1280px', height: '900px' } }` |
| `parameters.viewport.defaultViewport` | `'mobile'` |

---

## Story Variant Inventory

### Stories to fix (broken image refs)

| File | Line(s) | Current value | Replacement |
|---|---|---|---|
| `app/features/menu/components/MenuDishCard.stories.ts` | 33 | `'/menu/ayce/bora_bora.webp'` | `'https://placehold.co/400x300'` |
| `app/features/menu/components/MenuDishGrid.stories.ts` | 33, 110 | `'/menu/ayce/bora_bora.webp'` | `'https://placehold.co/400x300'` |

### Stories to add (by component category)

#### UI Primitives (`app/components/ui/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN | Add AccentVariant |
|---|---|---|---|---|---|---|---|
| Button | — | — | — | Yes | — | — | Yes (AYCE/Express) |
| Card | — | — | — | — | — | — | — |
| Chip | — | — | — | Yes | Yes | Yes | Yes (AYCE/Express) |
| Input | — | — | Yes | Yes | Yes | Yes | — |
| Select | — | — | Yes | Yes | Yes | Yes | — |
| Textarea | — | — | Yes | Yes | Yes | Yes | — |
| Kicker | — | — | — | — | Yes | Yes | — |
| Lightbox | — | — | — | — | — | — | — |
| MapView | Yes | — | — | — | — | — | — |
| Marquee | — | — | — | — | Yes | Yes | — |
| Nav | — | — | — | — | Yes | Yes | — |
| PageHeader | — | — | — | — | Yes | Yes | — |
| PromotionCard | — | — | — | — | Yes | Yes | — |
| Sticker | — | — | — | — | — | — | — |
| Tokens | — | — | — | — | — | — | — |

#### Layout (`app/components/layout/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| SiteFooter | — | — | — | — | Yes | Yes |
| SiteHeader | — | — | — | — | Yes | Yes |
| SiteLogo | — | — | — | — | — | — |
| SiteMarquee | — | — | — | — | Yes | Yes |

#### Staff (`app/components/staff/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| CustomerCard | — | — | — | — | — | — |
| LoginForm | — | — | Yes | — | — | — |
| RewardsList | — | Yes | — | — | — | — |
| TransactionTable | Yes | Yes | — | — | — | — |
| VisitButton | — | — | — | Yes | — | — |

#### Branches feature (`app/features/branches/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| BranchCard | — | — | — | — | Yes | Yes |
| BranchList | Yes | Yes | — | — | — | — |
| BranchSearch | — | — | Yes | — | Yes | Yes |

#### Contact feature (`app/features/contact/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| ContactForm | — | — | Yes | — | Yes | Yes |
| ContactInfo | — | — | — | — | Yes | Yes |

#### Homepage feature (`app/features/homepage/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| DishCard | — | — | — | — | Yes | Yes |
| HomeBranchesCta | — | — | — | — | Yes | Yes |
| HomeFeaturedRail | Yes | Yes | — | — | — | — |
| HomeHero | — | — | — | — | Yes | Yes |
| HomePromotions | — | Yes | — | — | — | — |
| HomeReviews | — | Yes | — | — | — | — |
| HomeTypeSelector | — | — | — | — | Yes | Yes |
| ReviewCard | — | — | — | — | Yes | Yes |

#### Menu feature (`app/features/menu/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| MenuCategoryChips | — | — | — | — | Yes | Yes |
| MenuDishCard | — | — | — | — | Yes | Yes |
| MenuDishGrid | Yes | Yes | — | — | — | — |
| MenuDrinkSection | — | Yes | — | — | Yes | Yes |
| MenuModalityToggle | — | — | — | — | Yes | Yes |
| MenuSaucePicker | — | — | — | — | Yes | Yes |
| MenuShell | Yes | Yes | — | — | — | — |
| MenuTypeToggle | — | — | — | — | Yes | Yes |

#### Promotions feature (`app/features/promotions/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| PromotionsGrid | — | Yes | — | — | — | — |

#### Reservation feature (`app/features/reservation/`)

| Component | Add Loading | Add Empty | Add Error | Add Disabled | Add LocaleES | Add LocaleEN |
|---|---|---|---|---|---|---|
| ReservationConfirmation | — | — | — | — | Yes | Yes |
| ReservationFieldsContact | — | — | Yes | — | Yes | Yes |
| ReservationFieldsDateTime | — | — | Yes | — | — | — |
| ReservationFieldsPrimary | — | — | Yes | — | Yes | Yes |
| ReservationForm | Yes | — | Yes | — | — | — |

---

## ComponentDocs Index Stories (new files)

| File | `title` | Components listed |
|---|---|---|
| `app/features/branches/Branches.stories.ts` | `'Features/Branches'` | BranchCard, BranchList, BranchSearch |
| `app/features/contact/Contact.stories.ts` | `'Features/Contact'` | ContactForm, ContactInfo |
| `app/features/homepage/Homepage.stories.ts` | `'Features/Homepage'` | DishCard, HomeBranchesCta, HomeFeaturedRail, HomeHero, HomePromotions, HomeReviews, HomeTypeSelector, ReviewCard |
| `app/features/menu/Menu.stories.ts` | `'Features/Menu'` | MenuCategoryChips, MenuDishCard, MenuDishGrid, MenuDrinkSection, MenuModalityToggle, MenuSaucePicker, MenuShell, MenuTypeToggle |
| `app/features/promotions/Promotions.stories.ts` | `'Features/Promotions'` | PromotionsGrid |
| `app/features/reservation/Reservation.stories.ts` | `'Features/Reservation'` | ReservationConfirmation, ReservationFieldsContact, ReservationFieldsDateTime, ReservationFieldsPrimary, ReservationForm |
| `app/components/ui/UIPrimitives.stories.ts` | `'UI Primitives'` | Button, Card, Chip, Input, Kicker, Lightbox, MapView, Marquee, Nav, PageHeader, PromotionCard, Select, Sticker, Textarea, Tokens + Layout (SiteFooter, SiteHeader, SiteLogo, SiteMarquee) + Staff (CustomerCard, LoginForm, RewardsList, TransactionTable, VisitButton) |
