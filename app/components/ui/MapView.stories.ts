import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { vi } from 'vitest'
import MapView from './MapView.vue'

// Stories use a mocked adapter so Storybook does not require a live Mapbox token.
// Gate VII.5: <UiMapView> story uses a mocked adapter.
const mockAdapter = {
  createMap: async (container: HTMLElement) => {
    container.style.background = 'var(--color-panel, #f5f0eb)'
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.innerHTML =
      '<span style="color:var(--color-soft, currentColor);font-family:sans-serif;font-size:14px">Map preview (mocked)</span>'
    return {}
  },
  addMarker: vi.fn(),
  removeMarker: vi.fn(),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  flyTo: vi.fn(),
  destroy: vi.fn(),
}

// Override useMapProvider for stories
vi.mock('../../composables/maps/useMapProvider', () => ({
  useMapProvider: () => mockAdapter,
}))

const meta = {
  title: 'UI/MapView',
  component: MapView,
  tags: ['autodocs'],
  argTypes: {
    style: { control: 'select', options: ['streets', 'light', 'dark'] },
    interactive: { control: 'boolean' },
    zoom: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  },
} satisfies Meta<typeof MapView>

export default meta
type Story = StoryObj<typeof meta>

const CDMX_CENTER: [number, number] = [-99.1332, 19.4326]

const AYCE_MARKERS = [
  {
    id: 'p1',
    position: [-99.1332, 19.4326] as [number, number],
    color: 'orange' as const,
  },
  {
    id: 'p2',
    position: [-99.19, 19.43] as [number, number],
    color: 'orange' as const,
  },
  {
    id: 'p3',
    position: [-99.08, 19.45] as [number, number],
    color: 'orange' as const,
  },
]

const EXPRESS_MARKERS = [
  {
    id: 'e1',
    position: [-99.15, 19.44] as [number, number],
    color: 'blue' as const,
  },
  {
    id: 'e2',
    position: [-99.05, 19.41] as [number, number],
    color: 'blue' as const,
  },
]

export const Default: Story = {
  args: {
    center: CDMX_CENTER,
    zoom: 11,
    markers: [...AYCE_MARKERS, ...EXPRESS_MARKERS],
    style: 'streets',
    interactive: true,
  },
  render: args => ({
    components: { MapView },
    setup: () => ({ args }),
    template: '<div style="height:400px"><MapView v-bind="args" /></div>',
  }),
}

export const AYCEPinsOnly: Story = {
  args: {
    center: CDMX_CENTER,
    zoom: 11,
    markers: AYCE_MARKERS,
    style: 'streets',
  },
  render: args => ({
    components: { MapView },
    setup: () => ({ args }),
    template: '<div style="height:400px"><MapView v-bind="args" /></div>',
  }),
}

export const ExpressPinsOnly: Story = {
  args: {
    center: CDMX_CENTER,
    zoom: 11,
    markers: EXPRESS_MARKERS,
    style: 'streets',
  },
  render: args => ({
    components: { MapView },
    setup: () => ({ args }),
    template:
      '<div class="scope-express" style="height:400px"><MapView v-bind="args" /></div>',
  }),
}

export const MixedPins: Story = {
  args: {
    center: CDMX_CENTER,
    zoom: 11,
    markers: [...AYCE_MARKERS, ...EXPRESS_MARKERS],
    style: 'light',
  },
  render: args => ({
    components: { MapView },
    setup: () => ({ args }),
    template: '<div style="height:400px"><MapView v-bind="args" /></div>',
  }),
}

export const FallbackState: Story = {
  args: {
    center: CDMX_CENTER,
    zoom: 11,
    markers: [],
  },
  render: () => ({
    components: { MapView },
    template: `
      <div style="height:400px">
        <MapView
          :center="[-99.1332, 19.4326]"
          :zoom="11"
          :markers="[]"
        >
          <template #fallback>
            <div class="flex flex-col items-center gap-2 p-6 text-center">
              <p class="font-disp text-ink">Mapa no disponible</p>
              <p class="text-sm text-soft">Verifique su conexión o token de Mapbox.</p>
            </div>
          </template>
        </MapView>
      </div>`,
  }),
}

export const Mobile: Story = {
  args: {
    center: CDMX_CENTER,
    zoom: 10,
    markers: AYCE_MARKERS,
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: args => ({
    components: { MapView },
    setup: () => ({ args }),
    template: '<div style="height:300px"><MapView v-bind="args" /></div>',
  }),
}

export const Desktop: Story = {
  args: {
    center: CDMX_CENTER,
    zoom: 12,
    markers: [...AYCE_MARKERS, ...EXPRESS_MARKERS],
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
  render: args => ({
    components: { MapView },
    setup: () => ({ args }),
    template: '<div style="height:500px"><MapView v-bind="args" /></div>',
  }),
}
