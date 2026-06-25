import type { MenuModality } from '@/types/menu'

/** Page-local state types for the menu feature. */

export type MenuType = 'ayce' | 'express'

export interface MenuPageQuery {
  type: MenuType
  modality: MenuModality
}
