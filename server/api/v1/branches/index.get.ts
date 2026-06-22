import { asc, eq } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import type {
  BranchPublicRow,
  BranchWithDistance,
} from '../../../../types/branches'
import { branches } from '../../../db/schema'
import {
  branchFinderConfig,
  buildRadii,
} from '../../../utils/branch-finder-config'
import { db } from '../../../utils/db'
import { handleError } from '../../../utils/error-handler'
import { haversineKm } from '../../../utils/haversine'
import { ok } from '../../../utils/response'

const querySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().positive().optional(),
  })
  .refine(data => (data.lat == null) === (data.lng == null), {
    message: 'lat and lng must be provided together',
  })

// Explicit whitelist — only these fields appear in the public response.
// Internal fields (whatsappReservacionesBackup, postalCode, createdAt,
// updatedAt) are excluded by not being listed here.
const PUBLIC_FIELDS = {
  id: branches.id,
  name: branches.name,
  address: branches.address,
  lat: branches.lat,
  lng: branches.lng,
  isActive: branches.isActive,
  type: branches.type,
  schedule: branches.schedule,
  phone: branches.whatsappReservaciones,
}

type BranchDistanceRow = BranchWithDistance

export default defineEventHandler(async event => {
  try {
    const query = querySchema.parse(getQuery(event))
    const { lat, lng, radius } = query

    if (lat != null && lng != null) {
      const rows = await db
        .select(PUBLIC_FIELDS)
        .from(branches)
        .where(eq(branches.isActive, true))

      const withDistance: BranchDistanceRow[] = []
      for (const r of rows) {
        if (r.lat == null || r.lng == null) continue
        const branch: BranchPublicRow = {
          id: r.id,
          name: r.name,
          address: r.address,
          lat: r.lat,
          lng: r.lng,
          isActive: r.isActive,
          type: r.type as 'ayce' | 'express',
          schedule: (r.schedule as BranchPublicRow['schedule']) ?? null,
          phone: r.phone ?? null,
        }
        withDistance.push({
          ...branch,
          distanceKm: haversineKm(
            lat,
            lng,
            parseFloat(r.lat),
            parseFloat(r.lng)
          ),
        })
      }

      const defaultRadius = radius ?? branchFinderConfig.defaultRadiusKm
      const radii = buildRadii(defaultRadius, branchFinderConfig.maxRadiusKm)

      for (const currentRadius of radii) {
        const filtered = withDistance.filter(b => b.distanceKm <= currentRadius)
        if (filtered.length > 0) {
          return {
            ...ok(filtered.sort((a, b) => a.distanceKm - b.distanceKm)),
            searchContext: {
              radiusUsed: currentRadius,
              expanded: currentRadius > defaultRadius,
              noResults: false,
            },
          }
        }
      }

      const maxRadius = radii[radii.length - 1]
      return {
        ...ok([]),
        searchContext: {
          radiusUsed: maxRadius,
          expanded: true,
          noResults: true,
        },
      }
    }

    const rows = await db
      .select(PUBLIC_FIELDS)
      .from(branches)
      .where(eq(branches.isActive, true))
      .orderBy(asc(branches.name))

    type PublicFieldRow = (typeof rows)[number]
    const publicRows: BranchPublicRow[] = rows.map((r: PublicFieldRow) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      isActive: r.isActive,
      type: r.type as 'ayce' | 'express',
      schedule: (r.schedule as BranchPublicRow['schedule']) ?? null,
      phone: r.phone ?? null,
    }))

    return ok(publicRows)
  } catch (err) {
    throw handleError(err)
  }
})
