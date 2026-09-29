import { describe, expect, it } from 'vitest'

import { PROTOTYPES, RESEARCH } from './catalog'
import { renderMarkdown } from './markdown'
import { SITE_PAGES } from './pages'
import proto01Doc from '../prototypes/proto-01/doc.md?raw'
import proto01DocV2 from '../prototypes/proto-01/doc-v2.md?raw'
import proto02Doc from '../prototypes/proto-02/doc.md?raw'

/** The research records, keyed by prototype id, read straight off disk.
 *
 * `proto-01-v2` is a second *version* of Proto 01's record, not a second
 * prototype: it is keyed separately so the prototype-keyed assertions below
 * stay about the prototype, and so the record set can be iterated on its own. */
const DOCS: Record<string, string> = {
  'proto-01': proto01Doc,
  'proto-01-v2': proto01DocV2,
  'proto-02': proto02Doc,
}

/**
 * Files that exist on disk, gathered through Vite so the test needs no
 * filesystem API and runs in the same module graph as everything else.
 *
 * The globs are enumerated per top-level directory rather than as one sweep
 * across the whole tree, so build output in `dist/` is never mistaken for
 * source. A sweep would also match this test's own directory oddly.
 */
// import.meta.glob must be called with a literal, so each pattern is written
// out rather than looped over.
const globs = [
  import.meta.glob('./*.md', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('./*.html', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../index.html', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../design.md', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../shared/*.md', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../experiments/*.html', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../prototypes/*.html', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../prototypes/*/doc*.md', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../prototypes/*/doc*.html', { eager: true, query: '?raw', import: 'default' }),
  import.meta.glob('../prototypes/*/app/index.html', { eager: true, query: '?raw', import: 'default' }),
]

const collected = globs.flatMap((found) => Object.keys(found))

/**
 * Every source file, keyed by its site-root path with a leading `/`. Glob keys
 * are relative to this test's directory, so `./x` means `shared/x` and
 * `../x` means `x`.
 */
const files = new Set(
  collected.map((key) => '/' + (key.startsWith('./') ? `shared/${key.slice(2)}` : key.slice(3))),
)

/**
 * Whether a site-root path resolves to a file that exists. A path ending in `/`
 * is a directory, so it is resolved to its `index.html` — the document a
 * browser will actually request.
 */
const exists = (sitePath: string): boolean =>
  files.has(sitePath.endsWith('/') ? `${sitePath}index.html` : sitePath)

/**
 * Paths a reader can follow on the built site.
 *
 * A `.md` file existing in the repository is not enough to make a link work.
 * Vite emits only the pages declared as build inputs, so a link to
 * `/design.md` answers 200 from the dev server — which serves the whole
 * project root — and 404s from `dist/`. Links are therefore checked against
 * this set, which is what the build actually produces.
 */
const published = new Set([
  '/',
  '/experiments/',
  '/shared/evidence-model.html',
  '/prototypes/proto-01/app/',
  // `docPagePath` is the rendered page. `documentationPath` is the raw `.md`,
  // which the build does not emit and a reader is never sent to.
  ...PROTOTYPES.map((p) => p.docPagePath),
  ...PROTOTYPES.filter((p) => p.appPath).map((p) => p.appPath!),
  // A record version is a page, not a prototype, so it is read from the one
  // place pages are declared rather than listed here a second time.
  SITE_PAGES.proto01DocV2,
])

const isPublished = (href: string): boolean => published.has(href)

describe('site build', () => {
  it('declares a build input for every page a reader can reach', () => {
    // Vite emits only the pages listed in `build.rollupOptions.input`. A page
    // that is linked but not declared works in dev — the dev server serves the
    // whole project — and 404s in `dist/`. This is the check for that.
    const declared = new Set(Object.values(SITE_PAGES))
    for (const href of published) {
      const target = href.endsWith('/') ? `${href}index.html` : href
      expect(declared.has(target), `${href} should be declared as a build input`).toBe(true)
    }
  })

  it('points every build input at a file that exists', () => {
    for (const [name, path] of Object.entries(SITE_PAGES)) {
      expect(files.has(path), `build input "${name}" (${path}) should exist`).toBe(true)
    }
  })

  it('has a page shell for every rendered document, not just the prototypes', () => {
    // A `.md` with no `.html` beside it is documentation a reader cannot open.
    for (const doc of ['/shared/evidence-model.md', ...PROTOTYPES.map((p) => p.documentationPath)]) {
      expect(exists(doc), `${doc} should exist`).toBe(true)
    }
    expect(published.has('/shared/evidence-model.html')).toBe(true)
  })

  it('gives every versioned record a page a reader can open', () => {
    // A second version of a record is only useful if it is reachable: the file,
    // the shell beside it, and the declaration that makes the build emit it.
    expect(exists('/prototypes/proto-01/doc-v2.md')).toBe(true)
    expect(exists(SITE_PAGES.proto01DocV2)).toBe(true)
    expect(published.has(SITE_PAGES.proto01DocV2)).toBe(true)
  })
})

describe('research catalog', () => {
  it('states the research question the repository exists to investigate', () => {
    expect(RESEARCH.question.length).toBeGreaterThan(20)
    expect(RESEARCH.title.trim()).not.toBe('')
  })

  it('gives every prototype a unique id, number and title', () => {
    expect(PROTOTYPES.length).toBeGreaterThan(0)
    expect(new Set(PROTOTYPES.map((p) => p.id)).size).toBe(PROTOTYPES.length)
    expect(new Set(PROTOTYPES.map((p) => p.number)).size).toBe(PROTOTYPES.length)
    for (const proto of PROTOTYPES) {
      expect(proto.id, 'id').toMatch(/^proto-\d{2}$/)
      expect(proto.number, `${proto.id} number`).toMatch(/^\d{2}$/)
      expect(proto.title.trim(), `${proto.id} title`).not.toBe('')
      expect(proto.description.trim(), `${proto.id} description`).not.toBe('')
    }
  })

  it('keeps exactly one built prototype, so the index has a real entry point', () => {
    const built = PROTOTYPES.filter((p) => p.status === 'built')
    expect(built.length, 'there should be one built prototype').toBe(1)
    expect(built[0]!.id).toBe('proto-01')
  })

  it('points every prototype at documentation that exists', () => {
    for (const proto of PROTOTYPES) {
      expect(DOCS[proto.id], `${proto.id} should have a doc.md loaded`).toBeDefined()
      expect(exists(proto.documentationPath), `${proto.id} doc.md should exist at ${proto.documentationPath}`).toBe(true)
      expect(exists(proto.docPagePath), `${proto.id} doc page should exist at ${proto.docPagePath}`).toBe(true)
    }
  })

  it('points a built prototype at an app that exists, and a planned one at nothing', () => {
    for (const proto of PROTOTYPES) {
      if (proto.status === 'built') {
        expect(proto.appPath, `${proto.id} should have an app path`).not.toBeNull()
        expect(exists(proto.appPath!), `${proto.id} app should exist at ${proto.appPath}`).toBe(true)
      } else {
        // A planned prototype must not advertise an app that does not exist.
        expect(proto.appPath, `${proto.id} is planned and should have no app path`).toBeNull()
      }
    }
  })

  it('numbers prototypes in catalog order, so the index reads as a sequence', () => {
    const numbers = PROTOTYPES.map((p) => p.number)
    expect(numbers).toEqual([...numbers].sort())
  })
})

describe('research records', () => {
  it('records the same research question in every prototype doc', () => {
    for (const [id, source] of Object.entries(DOCS)) {
      expect(source, `${id} should state the research question`).toContain('## Research question')
    }
  })

  it('covers the sections a research record needs, per prototype', () => {
    const required = [
      '## Status',
      '## Research question',
      '## Research protocol',
      '## Prototype',
      '## Observations',
      '## Findings',
      '## Limitations',
      '## Changelog',
    ]
    for (const [id, source] of Object.entries(DOCS)) {
      for (const heading of required) {
        expect(source, `${id} should have "${heading}"`).toContain(heading)
      }
    }
  })

  it('never records a finding Proto 01 has not earned', () => {
    // Proto 01 has had no user research. Every version of the record must say so
    // rather than implying the interface has been validated. A version 2 that
    // fills in the protocol is exactly where a result could get written by
    // accident, so the check is over the whole set, not just doc.md.
    for (const [id, source] of Object.entries(DOCS)) {
      if (id !== 'proto-01' && id !== 'proto-01-v2') continue
      const findings = source.split('## Findings')[1]?.split('\n## ')[0] ?? ''
      expect(findings, `${id} should have a Findings section`).toMatch(/no user research/i)
      expect(findings, `${id} should not claim participants were run`).not.toMatch(
        /\d+\s*(participants?|users?|people|sessions?)\s+(tested|observed|completed|took part|were run)/i,
      )
    }
  })

  it('states that Proto 01 has no findings, rather than omitting the section', () => {
    // An absent Findings heading would let a reader assume the section was
    // forgotten rather than empty on purpose.
    for (const source of [proto01Doc, proto01DocV2]) {
      const findings = source.split('## Findings')[1]?.split('\n## ')[0] ?? ''
      expect(findings.trim()).not.toBe('')
      expect(findings).toMatch(/no (user research|findings)/i)
    }
  })

  it('leaves the preregistered results empty in a record that has no data', () => {
    // The results table in version 2 is a promise about what will be filled in.
    // The first column names the measure and is meant to be readable; every
    // value cell has to be empty, and a row with a number in it is a finding.
    const results = proto01DocV2.split('## Findings')[1]?.split('\n## ')[0] ?? ''
    const rows = results.split('\n').filter((line) => /^\|/.test(line) && !/^\|\s*-/.test(line))
    const body = rows.slice(1)
    expect(body.length, 'results rows').toBeGreaterThan(5)
    for (const row of body) {
      const cells = row.split('|').slice(1, -1)
      expect(cells[0]?.trim(), `measure name should be present: ${row}`).not.toBe('')
      for (const cell of cells.slice(1)) {
        expect(cell.trim(), `value cell should be empty: ${row}`).toBe('')
      }
    }
    expect(results, 'should say the study has not been run').toMatch(/not been run/i)
  })

  it('records a protocol as a plan, not as a completed study', () => {
    // Version 2 states a sample and a recruitment route. Both are verbs about
    // the future, and a record that quietly moves to past tense is the specific
    // failure this guards against.
    expect(proto01DocV2.split('## Status')[1]?.split('\n## ')[0] ?? '').toMatch(/not yet run/i)
    const protocol = proto01DocV2.split('## Research protocol')[1]?.split('\n## ')[0] ?? ''
    // The decision rule has to be fixed in advance to be worth anything, so the
    // record must say when it was written.
    expect(protocol).toMatch(/before running|before data is collected/i)
    expect(protocol).toMatch(/recruit through/i)
  })

  it('marks undecided protocol sections as undefined instead of inventing them', () => {
    for (const [id, source] of Object.entries(DOCS)) {
      // Every "### " subsection of the protocol that carries no content must
      // say so. Prototypes with content (Proto 01's measures) are exempt.
      const protocol = source.split('## Research protocol')[1]?.split('\n## ')[0] ?? ''
      for (const block of protocol.split('\n### ').slice(1)) {
        const heading = block.split('\n')[0]!.trim()
        const body = block.split('\n').slice(1).join('\n').trim()
        if (body === '' || /^not yet defined\.?$/i.test(body)) {
          expect(body, `${id} → ${heading} should say "Not yet defined."`).toMatch(/^not yet defined\.?$/i)
        }
      }
    }
  })

  it('links each doc to the shared evidence model and to the design system', () => {
    expect(proto01Doc).toContain('evidence-model.md')
    expect(proto01Doc).toContain('design.md')
  })

  it('uses absolute cross-links that resolve from the rendered page, not from the file', () => {
    // doc.md is read as raw text, so a link written relative to the .md file
    // would resolve against /prototypes/<id>/ on the rendered page and 404.
    // These paths are the ones the rendered pages actually serve.
    for (const [id, source] of Object.entries(DOCS)) {
      for (const [, href] of source.matchAll(/\]\(([^)]+)\)/g)) {
        if (href.startsWith('#') || /^(https?:|mailto:)/.test(href)) continue
        expect(
          href.startsWith('/'),
          `${id} link "${href}" should be root-absolute so it works from the rendered page`,
        ).toBe(true)
      }
    }
  })

  it('only links a doc to a page the production build actually publishes', () => {
    for (const [id, source] of Object.entries(DOCS)) {
      for (const [, href] of source.matchAll(/\]\(([^)]+)\)/g)) {
        if (!href.startsWith('/')) continue
        // The bug this guards against: a link that resolves in the dev server
        // because it serves the repo root, and 404s in dist/ where only the
        // declared build inputs exist.
        expect(isPublished(href), `${id} link "${href}" is not a published page`).toBe(true)
        expect(exists(href), `${id} link "${href}" should resolve to a real file`).toBe(true)
      }
    }
  })

  it('does not send a reader to a raw Markdown file', () => {
    for (const [id, source] of Object.entries(DOCS)) {
      for (const [, href] of source.matchAll(/\]\(([^)]+)\)/g)) {
        expect(
          href.endsWith('.md'),
          `${id} links to raw Markdown at "${href}"; reference it as \`code\` instead`,
        ).toBe(false)
      }
    }
  })
})

describe('markdown renderer', () => {
  it('exposes a document title without the heading marker', () => {
    // `RegExp.exec` returns the whole match at index 0 and the capture group at
    // index 1. Reading index 0 put a literal `#` in the page title, which is the
    // kind of thing only a real browser shows you.
    for (const source of ['# Evidence model\n\nbody\n', '\n\n# Spaced title\n\nbody\n']) {
      const title = renderMarkdown(source).headings.find((h) => h.level === 1)?.text
      expect(title, 'the h1 text should carry no marker').toMatch(/^[A-Z]/)
      expect(title).not.toContain('#')
    }
  })

  it('renders headings with stable, unique ids', () => {
    const { headings, html } = renderMarkdown('# Title\n\n## One\n\n## One\n\n### Deep\n')
    expect(headings.map((h) => h.id)).toEqual(['title', 'one', 'one-1', 'deep'])
    expect(html).toContain('<h1 id="title">Title</h1>')
    expect(html).toContain('<h2 id="one-1">One</h2>')
  })

  it('renders paragraphs, and joins wrapped lines into one', () => {
    const { html } = renderMarkdown('one line\nstill one line\n\nsecond\n')
    expect(html).toBe('<p>one line still one line</p>\n<p>second</p>')
  })

  it('renders unordered, ordered and task lists', () => {
    const { html } = renderMarkdown('- a\n- b\n\n1. one\n2. two\n\n- [ ] todo\n- [x] done\n')
    expect(html).toContain('<ul><li>a</li><li>b</li></ul>')
    expect(html).toContain('<ol><li>one</li><li>two</li></ol>')
    expect(html).toContain('class="task-box"')
    expect(html).toContain('task-box is-done')
  })

  it('renders tables with a header row and body', () => {
    const { html } = renderMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |\n')
    expect(html).toContain('<thead><tr><th>A</th><th>B</th></tr></thead>')
    expect(html).toContain('<tbody><tr><td>1</td><td>2</td></tr></tbody>')
    expect(html).toContain('table-scroll')
  })

  it('renders fenced code blocks without interpreting their contents', () => {
    const { html } = renderMarkdown('```ts\nconst a = 1 < 2 && "x"\n```\n')
    expect(html).toContain('<pre><code class="language-ts">const a = 1 &lt; 2 &amp;&amp; &quot;x&quot;</code></pre>')
  })

  it('renders inline code, bold, italic and links', () => {
    const { html } = renderMarkdown('`code` **bold** *italic* [text](/target)\n')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<a href="/target">text</a>')
  })

  it('does not render emphasis inside inline code', () => {
    const { html } = renderMarkdown('`*not italic*`\n')
    expect(html).toContain('<code>*not italic*</code>')
    expect(html).not.toContain('<em>')
  })

  it('escapes HTML inside an inline code span', () => {
    // The code span is lifted off the raw line before the rest of the text is
    // escaped, so it has to be escaped where it is captured. Otherwise a doc
    // that quotes a tag in backticks would render that tag as live markup.
    const { html } = renderMarkdown('use `<script>alert(1)</script>` here\n')
    expect(html).toContain('<code>&lt;script&gt;alert(1)&lt;/script&gt;</code>')
    expect(html).not.toContain('<script>')
  })

  it('escapes HTML inside an inline code span that also contains quotes and ampersands', () => {
    const { html } = renderMarkdown('`a && b == "c" < d`\n')
    expect(html).toContain('<code>a &amp;&amp; b == &quot;c&quot; &lt; d</code>')
  })

  it('renders blockquotes and rules', () => {
    const { html } = renderMarkdown('> quoted line\n> continued\n\n---\n')
    expect(html).toContain('<blockquote>quoted line continued</blockquote>')
    expect(html).toContain('<hr />')
  })

  it('escapes HTML in the source rather than passing it through', () => {
    const { html } = renderMarkdown('a <script>alert(1)</script> b\n')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('refuses a script-bearing link target', () => {
    const { html } = renderMarkdown('[click](javascript:alert(1))\n')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('href="#"')
  })

  it('resolves a bare filename as a relative link, which is how docs cross-reference', () => {
    const { html } = renderMarkdown('[model](../shared/evidence-model.md)\n')
    expect(html).toContain('href="../shared/evidence-model.md"')
  })

  it('renders every research record without dropping content', () => {
    for (const [id, source] of Object.entries(DOCS)) {
      const { html, headings } = renderMarkdown(source)
      // Every heading in the record must survive into the page, and no section
      // may come out empty.
      const level2 = source.split('\n').filter((line) => line.startsWith('## ')).length
      expect(headings.filter((h) => h.level === 2).length, `${id} level-2 headings`).toBe(level2)
      expect(html.length, `${id} rendered length`).toBeGreaterThan(500)
      expect(html, `${id} should have no unrendered fence`).not.toContain('```')
    }
  })
})
