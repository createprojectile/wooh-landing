/** Fetch helper: never caches, throws on non-2xx, returns parsed JSON. */
export async function getJSON(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** Fire-and-forget POST used for analytics counters. */
export function postJSON(url, options = {}) {
  return getJSON(url, { method: 'POST', ...options });
}
