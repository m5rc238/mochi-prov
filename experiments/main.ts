import gsap from 'gsap'

import { PROTOTYPES, RESEARCH } from '../shared/catalog'
import '../shared/site.css'
import './index.css'

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

const app = document.getElementById('app')!
app.textContent = ''

/* --- Header ---------------------------------------------------------------- */
const header = el('header', 'site-header sticky top-0 z-10')
const headerInner = el('div', 'mx-auto flex max-w-3xl items-center gap-4 px-8 py-4')
const brand = el('a', 'site-link ds-label')
brand.href = '/experiments/'
brand.textContent = 'Research index'
headerInner.append(brand)
const headerSpacer = el('div')
headerInner.append(headerSpacer)
const modelLink = el('a', 'site-link')
modelLink.href = '/shared/evidence-model.html'
modelLink.textContent = 'Evidence model'
headerInner.append(modelLink)
header.append(headerInner)
app.append(header)

/* --- Research question ----------------------------------------------------- */
const main = el('main', 'mx-auto max-w-3xl px-8 pt-16 pb-24')

const questionSection = el('section')
const questionLabel = el('p', 'ds-label')
questionLabel.textContent = 'Research question'
questionSection.append(questionLabel, el('h1', 'question mt-3', RESEARCH.question))
main.append(questionSection)

/* --- Prototypes ------------------------------------------------------------ */
const protoSection = el('section', 'mt-20')
const protoLabel = el('p', 'ds-label')
protoLabel.textContent = 'Prototypes'
protoSection.append(protoLabel)

const list = el('div', 'mt-4 flex flex-col gap-3')

for (const proto of PROTOTYPES) {
  const card = el('article', 'proto-card p-5')
  card.dataset.prototype = proto.id

  const meta = el('div', 'proto-meta')
  const number = el('span', 'proto-number', `Proto ${proto.number}`)
  const title = el('h2', 'proto-title')
  // The whole card is not clickable: the two actions are the links, and a
  // nested interactive region inside a link is an accessibility trap.
  title.textContent = proto.title
  meta.append(number, title)
  card.append(meta)

  const chain = el('p', 'proto-chain mt-2', proto.description)
  card.append(chain)

  const footer = el('div', 'mt-5 flex flex-wrap items-center gap-3')
  const status = el('span', `status status-${proto.status}`)
  status.textContent = proto.status
  footer.append(status)

  const actions = el('div', 'ml-auto flex flex-wrap items-center gap-2')
  if (proto.appPath) {
    const open = el('a', 'action action-primary')
    open.href = proto.appPath
    open.textContent = 'Open prototype'
    actions.append(open)
  }
  const doc = el('a', 'action')
  doc.href = proto.docPagePath
  doc.textContent = 'Documentation'
  doc.setAttribute('aria-label', `Documentation for Proto ${proto.number}, ${proto.title}`)
  actions.append(doc)

  if (!proto.appPath) {
    // A planned prototype has nothing to open. Say so rather than showing a
    // link that would 404.
    const note = el('span', 'ds-caption')
    note.textContent = 'Not built yet — the research plan is documented below.'
    actions.append(note)
  }

  footer.append(actions)
  card.append(footer)
  list.append(card)
}

protoSection.append(list)
main.append(protoSection)

/* --- Footer ---------------------------------------------------------------- */
const footer = el('footer', 'mx-auto max-w-3xl border-t px-8 py-8 ds-divider')
const footerNote = el('p', 'ds-caption')
footerNote.textContent =
  'This is a research catalog. Each prototype’s documentation is the source of truth for what it is and what has been observed about it.'
const designNote = el('p', 'ds-caption mt-2')
designNote.append('Visual system: ', el('code', '', 'design.md'))
footer.append(footerNote, designNote)
main.append(footer)
app.append(main)

/* --- Motion ----------------------------------------------------------------
 * The cards settle in once on load. This is the only motion on the page, it
 * carries no information, and it is dropped entirely under reduced motion. */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!reduced) {
  gsap.from(list.children, {
    opacity: 0,
    y: 8,
    duration: 0.36,
    stagger: 0.06,
    ease: 'power2.out',
  })
}
