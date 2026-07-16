import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, h, onMounted, ref } from 'vue'
import { makeMarkerElement } from '@/composables/maps/adapters/mapboxAdapter'

/**
 * MapView renders an interactive Mapbox map.
 * In Storybook, the actual map is replaced by a visual stub to avoid
 * requiring a live Mapbox token. The real component is tested in the app.
 */
const meta: Meta = {
  title: 'UI/MapView',
  tags: ['autodocs'],
  argTypes: {
    center: {
      description: 'Map center coordinates as [longitude, latitude]',
      control: { type: 'object' },
    },
    zoom: {
      description: 'Initial zoom level (1=world, 20=building)',
      control: { type: 'range', min: 1, max: 20, step: 1 },
    },
    markers: {
      description: 'Array of map pin objects with id, position, and color',
      control: { type: 'object' },
    },
    style: {
      description: 'Mapbox map style preset',
      control: { type: 'select' },
      options: ['streets', 'light', 'dark'],
    },
    interactive: {
      description: 'Enables pan/zoom interaction on the map',
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

function mapStub(label: string, height = '400px', tone: 'bg2' | 'bg' = 'bg2') {
  const bgClass = tone === 'bg' ? 'bg-bg' : 'bg-bg2'
  return `
    <div
      class="flex flex-col items-center justify-center gap-2 rounded-pop border-pop border-ink ${bgClass} font-body"
      style="height:${height};"
    >
      <span class="text-3xl" aria-hidden="true">🗺️</span>
      <span class="text-sm text-soft">${label}</span>
    </div>`
}

export const Default: Story = {
  args: {
    center: [-99.1332, 19.4326],
    zoom: 11,
    markers: [
      { id: 'p1', position: [-99.1332, 19.4326], color: 'orange' },
      { id: 'e1', position: [-99.15, 19.44], color: 'blue' },
    ],
    style: 'streets',
    interactive: true,
  },
  render: () => ({
    template: mapStub('Map preview — center:[-99.1332,19.4326] zoom:11'),
  }),
}

export const Mobile: Story = {
  args: {
    center: [-99.1332, 19.4326],
    zoom: 10,
    markers: [{ id: 'p1', position: [-99.1332, 19.4326], color: 'orange' }],
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => ({
    template: mapStub('Map preview — Mobile (360px)', '300px'),
  }),
}

export const Desktop: Story = {
  args: {
    center: [-99.1332, 19.4326],
    zoom: 12,
    markers: [
      { id: 'p1', position: [-99.1332, 19.4326], color: 'orange' },
      { id: 'e1', position: [-99.15, 19.44], color: 'blue' },
    ],
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
  render: () => ({
    template: mapStub('Map preview — Desktop (1280px)', '500px'),
  }),
}

export const AYCEPinsOnly: Story = {
  name: 'AYCE Pins Only',
  args: {
    center: [-99.1332, 19.4326],
    zoom: 11,
    markers: [
      { id: 'p1', position: [-99.1332, 19.4326], color: 'orange' },
      { id: 'p2', position: [-99.19, 19.43], color: 'orange' },
      { id: 'p3', position: [-99.08, 19.45], color: 'orange' },
    ],
    style: 'streets',
  },
  render: () => ({
    template: mapStub('Map preview — 3 AYCE pins (orange)'),
  }),
}

export const ExpressPinsOnly: Story = {
  name: 'Express Pins Only',
  args: {
    center: [-99.1332, 19.4326],
    zoom: 11,
    markers: [
      { id: 'e1', position: [-99.15, 19.44], color: 'blue' },
      { id: 'e2', position: [-99.05, 19.41], color: 'blue' },
    ],
    style: 'streets',
  },
  render: () => ({
    template: mapStub('Map preview — 2 Express pins (blue)'),
  }),
}

export const MixedPins: Story = {
  name: 'Mixed AYCE + Express Pins',
  args: {
    center: [-99.1332, 19.4326],
    zoom: 11,
    markers: [
      { id: 'p1', position: [-99.1332, 19.4326], color: 'orange' },
      { id: 'e1', position: [-99.15, 19.44], color: 'blue' },
    ],
    style: 'light',
  },
  render: () => ({
    template: mapStub('Map preview — mixed AYCE + Express pins'),
  }),
}

export const FallbackState: Story = {
  name: 'Fallback — map unavailable',
  args: { center: [-99.1332, 19.4326], zoom: 11, markers: [] },
  render: () => ({
    template: `
      <div class="flex flex-col items-center justify-center gap-2 rounded-pop border-pop border-ink bg-bg2 p-8 text-center font-body" style="height:400px;">
        <p class="font-disp text-base font-extrabold text-ink">Mapa no disponible</p>
        <p class="text-sm text-soft">Verifica tu conexión o el token de Mapbox.</p>
      </div>`,
  }),
}

export const Loading: Story = {
  name: 'Loading — map initializing',
  args: { center: [-99.1332, 19.4326], zoom: 11, markers: [] },
  render: () => ({
    template: mapStub('Map initializing…', '400px', 'bg'),
  }),
}

/**
 * Demonstrates the REAL per-pin marker DOM produced by
 * `makeMarkerElement()` in the mapbox adapter (feature 024) — an AYCE pin
 * (generic SUMO mark) next to an Express pin (actual Sumo Express vertical
 * lockup). This is the actual production function, not reimplemented
 * markup; only the surrounding `<MapView>` canvas itself is stubbed above
 * (documented exception: requires a live Mapbox token to render).
 */
const MarkerBrandingDemo = defineComponent({
  name: 'MarkerBrandingDemo',
  setup() {
    const aycePinHost = ref<HTMLDivElement | null>(null)
    const expressPinHost = ref<HTMLDivElement | null>(null)
    onMounted(() => {
      aycePinHost.value?.appendChild(makeMarkerElement('orange'))
      expressPinHost.value?.appendChild(makeMarkerElement('blue'))
    })
    return { aycePinHost, expressPinHost }
  },
  render() {
    return h(
      'div',
      {
        class:
          'flex items-end gap-10 rounded-pop border-pop border-ink bg-bg2 p-8',
      },
      [
        h('div', { class: 'flex flex-col items-center gap-2' }, [
          h('div', { ref: 'aycePinHost' }),
          h('span', { class: 'text-sm font-body text-soft' }, 'AYCE pin'),
        ]),
        h('div', { class: 'flex flex-col items-center gap-2' }, [
          h('div', { ref: 'expressPinHost' }),
          h('span', { class: 'text-sm font-body text-soft' }, 'Express pin'),
        ]),
      ]
    )
  },
})

export const MarkerBranding: Story = {
  name: 'Marker Branding — AYCE vs Express (real pin DOM)',
  args: { center: [-99.1332, 19.4326], zoom: 11, markers: [] },
  render: () => ({
    components: { MarkerBrandingDemo },
    template: '<MarkerBrandingDemo />',
  }),
}
