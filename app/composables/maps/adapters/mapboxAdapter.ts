// app/composables/maps/adapters/mapboxAdapter.ts
// Only file in app/ allowed to import mapbox-gl directly (FR-014).
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import type { MapAdapter, MapMarker } from '../types'

const STYLE_URLS: Record<string, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
}

const DEFAULT_STYLE: string =
  STYLE_URLS.streets ?? 'mapbox://styles/mapbox/streets-v12'

/** Stores marker instances by id so we can remove them */
const markerRegistry = new Map<unknown, Map<string, mapboxgl.Marker>>()

function getRegistry(map: unknown): Map<string, mapboxgl.Marker> {
  if (!markerRegistry.has(map)) {
    markerRegistry.set(map, new Map())
  }
  // Always present after the set above
  return markerRegistry.get(map) as Map<string, mapboxgl.Marker>
}

function resolveStyle(style?: string): string {
  if (!style) return DEFAULT_STYLE
  return STYLE_URLS[style] ?? DEFAULT_STYLE
}

/**
 * Per-marker brand mark: AYCE pins keep the generic SUMO mark, Express pins
 * carry the actual Sumo Express vertical lockup (FR-009/FR-010). Exported for
 * direct unit testing (see mapboxAdapter.spec.ts) — this is the only place in
 * app/ allowed to know about these specific asset paths.
 */
export function markerLogoSrc(color: 'orange' | 'blue'): string {
  return color === 'blue'
    ? '/brand/sumo-express-vertical.webp'
    : '/brand/sumo-vertical.svg'
}

export function makeMarkerElement(color: 'orange' | 'blue'): HTMLDivElement {
  const brandColor =
    color === 'orange' ? 'rgb(var(--orange))' : 'rgb(var(--blue))'
  const ink = 'rgb(var(--ink))'

  const wrap = document.createElement('div')
  wrap.className = `map-pin map-pin--${color}`
  wrap.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'cursor:pointer',
    `filter:drop-shadow(2px 3px 0 ${ink})`,
  ].join(';')

  // Body: colored rounded rect with logo on top
  const body = document.createElement('div')
  body.style.cssText = [
    'width:48px',
    'height:60px',
    `background:${brandColor}`,
    `border:2.5px solid ${ink}`,
    'border-radius:10px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:4px',
    'box-sizing:border-box',
  ].join(';')

  const img = document.createElement('img')
  img.src = markerLogoSrc(color)
  img.alt = color === 'blue' ? 'SUMO Express' : 'SUMO'
  img.draggable = false
  img.style.cssText = 'width:100%;height:100%;object-fit:contain;'

  body.appendChild(img)

  // Triangle tail in brand color, pointing down
  const tail = document.createElement('div')
  tail.style.cssText = [
    'width:0',
    'height:0',
    'border-left:8px solid transparent',
    'border-right:8px solid transparent',
    `border-top:10px solid ${brandColor}`,
  ].join(';')

  wrap.appendChild(body)
  wrap.appendChild(tail)
  return wrap
}

export const mapboxAdapter: MapAdapter = {
  async createMap(container, options) {
    const token = options.accessToken ?? ''
    if (!token) {
      throw new Error(
        'Mapbox access token is missing. Set NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN.'
      )
    }
    mapboxgl.accessToken = token
    const styleUrl = resolveStyle(
      Object.entries(STYLE_URLS).find(([, v]) => v === options.style)?.[0]
    )
    const map = new mapboxgl.Map({
      container,
      style: styleUrl,
      center: options.center as [number, number],
      zoom: options.zoom,
    })
    return new Promise<mapboxgl.Map>((resolve, reject) => {
      map.on('load', () => resolve(map))
      map.on('error', e => reject(e.error ?? new Error('Map load error')))
    })
  },

  addMarker(map, marker) {
    const mapInstance = map as mapboxgl.Map
    const el = makeMarkerElement(marker.color)
    const mbMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(marker.position as [number, number])
      .addTo(mapInstance)

    if (marker.onClick) {
      const onClick = marker.onClick
      el.addEventListener('click', () => onClick(marker))
    }

    getRegistry(map).set(marker.id, mbMarker)
  },

  removeMarker(map, id) {
    const registry = getRegistry(map)
    const marker = registry.get(id)
    if (marker) {
      marker.remove()
      registry.delete(id)
    }
  },

  setCenter(map, position) {
    ;(map as mapboxgl.Map).setCenter(position as [number, number])
  },

  setZoom(map, zoom) {
    ;(map as mapboxgl.Map).setZoom(zoom)
  },

  flyTo(map, position, zoom) {
    ;(map as mapboxgl.Map).flyTo({
      center: position as [number, number],
      zoom: zoom ?? (map as mapboxgl.Map).getZoom(),
    })
  },

  fitBounds(map, markers, padding = 80) {
    if (markers.length === 0) return
    const m = map as mapboxgl.Map
    const first = markers[0] as MapMarker
    if (markers.length === 1) {
      m.flyTo({ center: first.position as [number, number], zoom: 14 })
      return
    }
    let minLng = first.position[0]
    let maxLng = first.position[0]
    let minLat = first.position[1]
    let maxLat = first.position[1]
    for (const mk of markers) {
      if (mk.position[0] < minLng) minLng = mk.position[0]
      if (mk.position[0] > maxLng) maxLng = mk.position[0]
      if (mk.position[1] < minLat) minLat = mk.position[1]
      if (mk.position[1] > maxLat) maxLat = mk.position[1]
    }
    m.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding, maxZoom: 14 }
    )
  },

  destroy(map) {
    markerRegistry.delete(map)
    ;(map as mapboxgl.Map).remove()
  },
}
