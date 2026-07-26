function words(text: string): string[] {
  return text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
}

export function mergeTranscript(committed: string, incoming: string): string {
  const left = words(committed)
  const right = words(incoming)
  if (!right.length) return committed.trim()
  const maxOverlap = Math.min(12, left.length, right.length)
  let overlap = 0
  for (let size = maxOverlap; size > 0; size -= 1) {
    const a = left.slice(-size).join(" ").toLowerCase().replace(/[^a-z0-9']/g, "")
    const b = right.slice(0, size).join(" ").toLowerCase().replace(/[^a-z0-9']/g, "")
    if (a === b) {
      overlap = size
      break
    }
  }
  const merged = [...left, ...right.slice(overlap)].join(" ").trim()
  return merged ? merged.charAt(0).toUpperCase() + merged.slice(1) : ""
}

export function cleanupTranscript(text: string): string {
  const value = text.replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim()
  if (!value) return ""
  const capitalised = value.charAt(0).toUpperCase() + value.slice(1)
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`
}
