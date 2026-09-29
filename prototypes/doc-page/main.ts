/* Documentation view. Renders a `.md` file — a prototype's research record or
 * a shared document — as a styled page. There is no hand-maintained copy of the
 * documentation in HTML anywhere in this repository. */

import gsap from 'gsap'

import { PROTOTYPES } from '../../shared/catalog'
import { renderMarkdown } from '../../shared/markdown'
import '../../shared/site.css'

/* Docs are imported as raw strings so the build inlines them. A doc that is
 * edited on disk is a doc the page picks up on reload, with no second file to
 * forget. Vite maps every doc at build time, so adding a prototype means adding
 * a doc.md — the lookup cannot drift out of sync with the catalog. */
const docs = import.meta.glob(['../*/doc.md', '../../shared/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const id = document.body.dataset.prototype ?? ''
const prototype = PROTOTYPES.find((item) => item.id === id)

const app = document.getElementById('app')!

/* A prototype page is bound to its id; a shared page carries the doc's own
 * glob key. Either way the Markdown is read from the same import map. */
const source =
  prototype !== undefined
    ? docs[`../${prototype.id}/doc.md`]
    : docs[document.body.dataset.doc ?? '']

if (source === undefined) {
  // A doc page pointing at a file that is not there is a build mistake, not a
  // state a reader should ever see.
  document.body.textContent = prototype
    ? `Missing research record for Proto ${prototype.number}.`
    : 'Missing document.'
  throw new Error(`No Markdown source for "${prototype?.id ?? id}"`)
}

app.textContent = ''

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/* A doc's own `# Heading` becomes the page title, so the title is not written
 * twice. Index 1 is the capture group; index 0 is the whole match, `#` and
 * all. The prototype fallback keeps a doc without an h1 from getting one. */
const firstHeading = /^\s*#\s+(.+)$/m.exec(source)?.[1]
document.title = prototype
  ? `Proto ${prototype.number} — ${prototype.title}`
  : (firstHeading ?? 'Documentation')

/* --- Site header ----------------------------------------------------------- */
const header = el('header', 'site-header sticky top-0 z-10')
const headerInner = el('div', 'mx-auto flex max-w-5xl items-center gap-4 px-8 py-4')
const back = el('a', 'site-link ds-label')
back.href = '/experiments/'
back.textContent = '← Research index'
headerInner.append(back)
header.append(headerInner)
app.append(header)

/* --- Layout: record in the middle, contents in the margin ------------------ */
const layout = el('div', 'mx-auto flex max-w-5xl items-start gap-12 px-8 pt-12 pb-24')

const main = el('main', 'min-w-0 flex-1')
const article = el('article', 'doc')

const { headings, html } = renderMarkdown(source)
// Headings carry their own anchor so any section is linkable, which is what
// makes a research record citable from a discussion.
article.innerHTML = html.replace(
  /<h([23]) id="([^"]+)">/g,
  (_m, level: string, anchor: string) =>
    `<h${level} id="${anchor}"><a class="heading-anchor" href="#${anchor}" aria-label="Link to this section">#</a>`,
)
main.append(article)
layout.append(main)

// A table of contents only earns its space in a document with enough sections
// to navigate. Two or fewer is just an index of a page you can see.
const contents = headings.filter((item) => item.level === 2)
if (contents.length >= 3) {
  const nav = el('nav', 'toc sticky top-24 shrink-0 w-52')
  nav.setAttribute('aria-label', 'Contents')
  nav.append(el('p', 'ds-label mb-2', 'Contents'))
  for (const heading of contents) {
    const link = el('a')
    link.href = `#${heading.id}`
    link.textContent = heading.text
    link.dataset.level = String(heading.level)
    nav.append(link)
  }
  layout.append(nav)
}

app.append(layout)

/* --- Footer ---------------------------------------------------------------- */
const footer = el('footer', 'mx-auto flex max-w-5xl flex-wrap items-center gap-3 border-t px-8 py-8 ds-divider')
if (prototype?.appPath) {
  const open = el('a', 'action action-primary')
  open.href = prototype.appPath
  open.textContent = 'Open prototype'
  footer.append(open)
}
const index = el('a', 'action')
index.href = '/experiments/'
index.textContent = prototype ? 'All prototypes' : 'Back to the research question'
footer.append(index)
/* No link to the `.md` itself. The record is the page; offering the raw file
 * would both break the production build — Vite emits only the pages declared
 * as build inputs — and hand a reader unstyled Markdown. */
app.append(footer)

/* --- Motion ----------------------------------------------------------------
 * The record fades up once. A reading surface that animates while being read
 * would be hostile, so this is load-only and gone under reduced motion. */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!reduced) {
  gsap.from(article, { opacity: 0, y: 6, duration: 0.32, ease: 'power2.out' })
}
