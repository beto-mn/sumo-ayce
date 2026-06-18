export function generateFolio(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}
