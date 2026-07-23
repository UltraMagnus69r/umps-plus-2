/**
 * Fetch helpers with optional CORS proxy. Not currently used by the app;
 * kept for future features (e.g. loading remote images or API data).
 */
export type FetcherOptions = {
  corsProxyBase?: string
  init?: RequestInit
}

export async function fetchWithCorsProxy(input: string, options: FetcherOptions = {}) {
  const { corsProxyBase, init } = options
  const url = corsProxyBase ? `${corsProxyBase}${encodeURIComponent(input)}` : input
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
  }
  return res
}

export async function fetchJson<T>(input: string, options: FetcherOptions = {}) {
  const res = await fetchWithCorsProxy(input, options)
  return (await res.json()) as T
}

export async function fetchBlob(input: string, options: FetcherOptions = {}) {
  const res = await fetchWithCorsProxy(input, options)
  return await res.blob()
}
