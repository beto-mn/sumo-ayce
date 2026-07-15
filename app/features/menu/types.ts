import type { PrimarySelection } from '@/features/menu/menu-sets'
import type { MenuModality } from '@/types/menu'

/** Page-local state types for the menu feature. */

/**
 * The API `type` param only knows `ayce | express`. The UI primary selector adds
 * a third client-side view, `bebidas` (drinks), which reuses the same API
 * response (drinks are `locationType='both'`).
 */
export type MenuType = 'ayce' | 'express'

/** Primary selection re-exported from the curated-set config. */
export type MenuPrimarySelection = PrimarySelection

export interface MenuPageQuery {
  type: MenuType
  modality: MenuModality
}

/**
 * A single-active choice for the reused picker (Wings sauces OR Vaso Sumo
 * flavours). `spiceLevel` only drives the sauce chili indicator.
 */
export interface PickerOption {
  id: string
  label: string
  spiceLevel?: number
}
