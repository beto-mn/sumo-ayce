// app/composables/maps/types.ts

/** [longitude, latitude] — Mapbox/GeoJSON convention */
export type LngLat = [longitude: number, latitude: number]

export interface MapMarker {
  id: string
  position: LngLat
  color: 'orange' | 'blue' // brand tokens: AYCE / Express
  popupContent?: string // HTML or sanitized text shown in popup
  onClick?: (marker: MapMarker) => void
}

export interface MapViewProps {
  center: LngLat
  zoom: number
  markers: MapMarker[]
  mapStyle?: 'streets' | 'light' | 'dark' // semantic, not provider-specific
  interactive?: boolean // default true
}

/** Contract every map adapter must implement */
export interface MapAdapter {
  createMap(
    container: HTMLElement,
    options: {
      center: LngLat
      zoom: number
      style: string // resolved provider URL
      accessToken?: string
    }
  ): Promise<unknown> // opaque map instance
  addMarker(map: unknown, marker: MapMarker): void
  removeMarker(map: unknown, id: string): void
  setCenter(map: unknown, position: LngLat): void
  setZoom(map: unknown, zoom: number): void
  flyTo(map: unknown, position: LngLat, zoom?: number): void
  fitBounds(map: unknown, markers: MapMarker[], padding?: number): void
  destroy(map: unknown): void
}
