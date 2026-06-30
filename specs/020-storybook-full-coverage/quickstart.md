# Quickstart: Storybook Full UI/UX Documentation Coverage

**Feature**: 020-storybook-full-coverage  
**Branch**: `chore/021-storybook-coverage`

## What this feature delivers

After implementation, `npm run storybook` launches a fully documented Storybook instance with:
- Zero broken image errors in the network console
- A Viewport toolbar preset (Mobile 375px / Tablet 768px / Desktop 1280px)
- An Accessibility panel running WCAG AA audits on every story
- Auto-generated Docs pages for every component (no manual MDX)
- State-variant stories (loading, empty, error, disabled, ES, EN) per component where applicable
- Interactive Controls panel with prop descriptions for every component
- Six feature-slice index pages (Branches, Contact, Homepage, Menu, Promotions, Reservation, UI Primitives)

## Step 1 — Install the new addons

```bash
npm install --save-dev @storybook/addon-viewport@^10.4.1 @storybook/addon-a11y@^10.4.1
```

## Step 2 — Update `.storybook/main.ts`

Change the `addons` array and `docs.autodocs` flag:

```ts
addons: [
  '@storybook/addon-docs',
  '@storybook/addon-viewport',
  '@storybook/addon-a11y',
],
docs: {
  autodocs: true,   // was: 'tag'
},
```

## Step 3 — Create or update `.storybook/preview.ts`

Add the custom viewport presets. If `preview.ts` does not exist, create it:

```ts
export const parameters = {
  viewport: {
    viewports: {
      mobile:  { name: 'Mobile (375px)',   styles: { width: '375px',  height: '812px'  } },
      tablet:  { name: 'Tablet (768px)',   styles: { width: '768px',  height: '1024px' } },
      desktop: { name: 'Desktop (1280px)', styles: { width: '1280px', height: '900px'  } },
    },
    defaultViewport: 'mobile',
  },
}
```

## Step 4 — Fix broken image references

In the two affected story files, replace `/menu/ayce/bora_bora.webp` with `https://placehold.co/400x300`:

- `app/features/menu/components/MenuDishCard.stories.ts` (line 33)
- `app/features/menu/components/MenuDishGrid.stories.ts` (lines 33 and 110)

## Step 5 — Update existing story files

For each story file, follow this pattern:

### a. Add `argTypes` to the Meta object

```ts
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    label: {
      description: 'Button text content',
      control: { type: 'text' },
    },
    variant: {
      description: 'Visual style variant',
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ink'],
    },
    disabled: {
      description: 'Disables interaction and applies disabled visual state',
      control: { type: 'boolean' },
    },
    size: {
      description: 'Button size: small or large',
      control: { type: 'select' },
      options: ['sm', 'lg'],
    },
  },
}
```

### b. Add state variant stories

```ts
export const Disabled: Story = {
  args: { label: 'Reservar', disabled: true },
}

export const AccentAYCE: Story = {
  args: { label: 'SUMO AYCE', variant: 'primary' },
  // The component uses --accent: var(--orange) in AYCE context
}

export const AccentExpress: Story = {
  args: { label: 'SUMO Express', variant: 'primary' },
  // Wrap in a decorator setting --accent: var(--blue) if the component uses --accent
  decorators: [
    (story) => ({
      template: '<div style="--accent: var(--blue)"><story /></div>',
    }),
  ],
}
```

### c. Add locale variant stories (where applicable)

```ts
export const LocaleES: Story = {
  args: { label: 'Nombre completo', placeholder: 'Tu nombre' },
}

export const LocaleEN: Story = {
  args: { label: 'Full name', placeholder: 'Your name' },
}
```

### d. Add loading and empty stories (where applicable)

```ts
export const Loading: Story = {
  args: { loading: true },
}

export const Empty: Story = {
  args: { items: [] },
}
```

## Step 6 — Create ComponentDocs index story files

For each feature slice, create a new `.stories.ts` file at the slice root:

```ts
// app/features/reservation/Reservation.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'

const meta: Meta = {
  title: 'Features/Reservation',
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--body, sans-serif); padding: 2rem; max-width: 800px;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Reservation Feature</h1>
        <p>This feature handles the reservation booking flow — branch selection, date/time picking, and confirmation.</p>
        <h2 style="margin-top: 2rem;">Components</h2>
        <ul>
          <li><strong>ReservationForm</strong> — full multi-step form orchestrating all fields</li>
          <li><strong>ReservationFieldsPrimary</strong> — branch selector + party size</li>
          <li><strong>ReservationFieldsDateTime</strong> — date + time slot picker</li>
          <li><strong>ReservationFieldsContact</strong> — name + WhatsApp phone</li>
          <li><strong>ReservationConfirmation</strong> — success confirmation display</li>
        </ul>
      </div>
    `,
  }),
}
```

## Step 7 — Verify

```bash
# Type-check all story files
npx vue-tsc --noEmit

# Lint and format
npx biome check app/**/*.stories.ts .storybook/

# Start Storybook and manually verify:
# 1. No 404 errors in browser console
# 2. Viewport toolbar has Mobile / Tablet / Desktop
# 3. Accessibility panel shows in the addons panel
# 4. Every component has a Docs tab with auto-generated page
# 5. Controls panel shows descriptions for each prop
npm run storybook

# Build Storybook (final gate)
npm run storybook:build
```

## 200-line overflow rule

If adding variants would push a story file over 200 lines, create a sibling file:

```
MenuDishGrid.stories.ts           ← Default + primary variants
MenuDishGrid.variants.stories.ts  ← Loading, Empty, additional states
```

Both files are picked up automatically by Storybook's glob: `'../app/**/*.stories.@(ts|tsx)'`.
