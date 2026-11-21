const URL_RE = /https?:\/\/[^\s)]+/g

/** Split text so each URL can be rendered as a link. */
export function parts(text: string): { text: string; href?: string }[] {
  const chunks: { text: string; href?: string }[] = []
  let last = 0
  for (const match of text.matchAll(URL_RE)) {
    const index = match.index ?? 0
    if (index > last) chunks.push({ text: text.slice(last, index) })
    chunks.push({ text: match[0], href: match[0] })
    last = index + match[0].length
  }
  if (last < text.length) chunks.push({ text: text.slice(last) })
  return chunks.length ? chunks : [{ text }]
}
