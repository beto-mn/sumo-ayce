import { z } from 'zod'

const toTitleCase = (str: string) =>
  str.replace(
    /\w\S*/g,
    w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  )

const phoneDigits = (str: string) => str.replace(/\D/g, '')

export const BranchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  postalCode: z.string().nullable(),
})

const today = () => new Date().toISOString().slice(0, 10)

export const CreateReservationSchema = z.object({
  branchId: z.string().uuid(),
  contactName: z.string().trim().min(1).max(100).transform(toTitleCase),
  contactPhone: z.string().trim().min(1).max(20).transform(phoneDigits),
  partySize: z.number().int().positive(),
  reservationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .refine(d => d >= today(), {
      message: 'Reservation date must not be in the past',
    }),
  reservationTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS'),
  notes: z.string().trim().max(500).optional(),
})

export const UpdateReservationSchema = z
  .object({
    status: z.enum(['pending', 'confirmed']).optional(),
    reservationDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
      .refine(d => d >= today(), {
        message: 'Reservation date must not be in the past',
      })
      .optional(),
    reservationTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS')
      .optional(),
    partySize: z.number().int().positive().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const ListReservationsQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  reservationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  contactName: z.string(),
  contactPhone: z.string(),
  partySize: z.number(),
  reservationDate: z.string(),
  reservationTime: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  notes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  deletedAt: z.union([z.string(), z.date()]).nullable(),
})

export type Branch = z.infer<typeof BranchSchema>
export type CreateReservation = z.infer<typeof CreateReservationSchema>
export type UpdateReservation = z.infer<typeof UpdateReservationSchema>
export type Reservation = z.infer<typeof ReservationSchema>
export type ListReservationsQuery = z.infer<typeof ListReservationsQuerySchema>
