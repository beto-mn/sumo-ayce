import { vi } from 'vitest'

// biome-ignore lint/suspicious/noExplicitAny: proxy mock requires any to be chainable
function makeProxy<T>(result: T): any {
  // biome-ignore lint/suspicious/noExplicitAny: proxy handler target type is intentionally loose
  const handler: ProxyHandler<any> = {
    get(_, prop) {
      if (prop === 'then')
        return (resolve: (v: T) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject)
      if (prop === 'catch')
        return (reject: (e: unknown) => unknown) =>
          Promise.resolve(result).catch(reject)
      if (prop === 'finally')
        return (cb: () => void) => Promise.resolve(result).finally(cb)
      return () => makeProxy(result)
    },
    apply: () => makeProxy(result),
  }
  return new Proxy(() => result, handler)
}

export function dbChain<T>(result: T) {
  return makeProxy(result)
}

export const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(mockDb)
  ),
}
