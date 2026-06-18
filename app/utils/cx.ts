/**
 * Tiny class-merging helper. Joins string fragments, dropping falsy values.
 * Replaces clsx / tailwind-merge for this codebase (Article X — KISS).
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
