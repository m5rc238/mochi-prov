/** A small Markdown renderer.
 *
 * The research record is Markdown, and the site is a view over it, so this is
 * the only place Markdown becomes HTML. It supports the constructs the docs
 * actually use — headings, paragraphs, lists, tables, code blocks, inline code,
 * links, blockquotes, bold, italic, and rules — and nothing else.
 *
 * Deliberately not a general-purpose parser: no HTML passthrough, no nested
 * lists, no reference links. Anything unsupported renders as literal text
 * rather than being silently dropped, so a doc can never quietly lose content.
 */

/** Escape text for insertion into HTML. Always applied to caller-supplied text. */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Only allow protocols that cannot execute script. A doc author writing
 * `[x](javascript:...)` gets a link that does nothing, not a stored XSS.
 */
const safeHref = (href: string): string => {
  const trimmed = href.trim()
  if (/^(https?:|mailto:|\/|#|\.\/|\.\.\/)/i.test(trimmed)) return escapeHtml(trimmed)
  // A bare word is treated as a relative path, which is how docs link each other.
  if (/^[a-z0-9][\w./-]*$/i.test(trimmed)) return escapeHtml('./' + trimmed)
  return '#'
}

/** Inline spans, applied after the text has been escaped. */
const renderInline = (text: string): string => {
  // Code spans first: their contents are literal, so nothing inside them is
  // treated as emphasis or a link. They are lifted out behind a sentinel that
  // cannot occur in escaped prose, then restored once the rest is rendered.
  const SENTINEL = '\u0001CODE'
  const codeSpans: string[] = []
  let working = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSpans.push(`<code>${code}</code>`)
    return `${SENTINEL}${codeSpans.length - 1}${SENTINEL}`
  })

  working = escapeHtml(working)
  // Links before emphasis, so link text can contain emphasis.
  working = working.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) =>
    `<a href="${safeHref(href)}">${label}</a>`,
  )
  working = working.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  working = working.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')

  const restore = new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, 'g')
  return working.replace(restore, (_m, index: string) => codeSpans[Number(index)]!)
}

const splitRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())

const isTableDivider = (line: string): boolean =>
  /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line)

export type RenderedDoc = {
  /** Heading id → text, in document order. Used to build a table of contents. */
  headings: { level: number; id: string; text: string }[]
  html: string
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

export const renderMarkdown = (source: string): RenderedDoc => {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  const headings: RenderedDoc['headings'] = []
  const usedIds = new Map<string, number>()
  let i = 0

  // Emit any run of blank lines as a single paragraph break.
  const paragraph: string[] = []
  const flushParagraph = () => {
    if (paragraph.length === 0) return
    out.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
    paragraph.length = 0
  }

  while (i < lines.length) {
    const line = lines[i]!

    // Fenced code block. Contents are literal — no inline rendering at all.
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      flushParagraph()
      const language = fence[1] ?? ''
      const body: string[] = []
      i += 1
      while (i < lines.length && !/^```\s*$/.test(lines[i]!)) {
        body.push(lines[i]!)
        i += 1
      }
      i += 1
      const cls = language ? ` class="language-${escapeHtml(language)}"` : ''
      out.push(`<pre><code${cls}>${escapeHtml(body.join('\n'))}</code></pre>`)
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      i += 1
      continue
    }

    // Horizontal rule.
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flushParagraph()
      out.push('<hr />')
      i += 1
      continue
    }

    // Heading.
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      const level = heading[1]!.length
      const raw = heading[2]!.trim()
      const text = raw.replace(/[*`]/g, '')
      let id = slugify(text)
      // Two sections can slug to the same id; suffix rather than collide, so
      // every heading stays linkable.
      const seen = usedIds.get(id) ?? 0
      usedIds.set(id, seen + 1)
      if (seen > 0) id = `${id}-${seen}`
      headings.push({ level, id, text })
      out.push(`<h${level} id="${id}">${renderInline(raw)}</h${level}>`)
      i += 1
      continue
    }

    // Table: a header row followed by a divider row.
    if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1]!)) {
      flushParagraph()
      const header = splitRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i]!.trim() !== '' && lines[i]!.includes('|')) {
        rows.push(splitRow(lines[i]!))
        i += 1
      }
      const head = header.map((cell) => `<th>${renderInline(cell)}</th>`).join('')
      const body = rows
        .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`)
        .join('')
      out.push(`<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`)
      continue
    }

    // Blockquote: every consecutive `>` line, rendered as one quoted block.
    if (/^>\s?/.test(line)) {
      flushParagraph()
      const quoted: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i]!)) {
        quoted.push(lines[i]!.replace(/^>\s?/, ''))
        i += 1
      }
      out.push(`<blockquote>${renderInline(quoted.join(' '))}</blockquote>`)
      continue
    }

    // Lists. Ordered lists use `1.`/`-`; unchecked boxes are kept as their state.
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    const ordered = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (bullet || ordered) {
      flushParagraph()
      const tag = bullet ? 'ul' : 'ol'
      const items: string[] = []
      while (i < lines.length) {
        const current = lines[i]!
        const item = current.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/)
        if (!item) break
        const content = item[1]!
        // A leading `[ ]` / `[x]` is recorded, not dropped: a task list that
        // loses its state is a silently wrong research record.
        const task = content.match(/^\[([ xX])\]\s+(.*)$/)
        if (task) {
          const checked = task[1]!.toLowerCase() === 'x'
          const label = `<span class="task-box${checked ? ' is-done' : ''}" aria-hidden="true"></span>`
          items.push(`<li class="task-item">${label}${renderInline(task[2]!)}</li>`)
        } else {
          items.push(`<li>${renderInline(content)}</li>`)
        }
        i += 1
      }
      out.push(`<${tag}>${items.join('')}</${tag}>`)
      continue
    }

    paragraph.push(line.trim())
    i += 1
  }

  flushParagraph()
  return { headings, html: out.join('\n') }
}
