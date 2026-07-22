export function mergeStickyToolSelection(options: {
  current: string[]
  previous?: string[]
  available: string[]
  allowed?: string[]
  maxVisible: number
}): string[] {
  const allowed = options.allowed ? new Set(options.allowed) : null
  const available = options.available.filter(id => !allowed || allowed.has(id))
  const availableSet = new Set(available)
  const current = options.current.filter(id => availableSet.has(id))
  const previous = (options.previous ?? []).filter(id => availableSet.has(id))
  const preferred = [...new Set([...current, ...previous])].slice(0, Math.max(1, options.maxVisible))
  const selected = new Set(preferred)
  return available.filter(id => selected.has(id))
}
