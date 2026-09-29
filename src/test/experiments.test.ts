import { describe, expect, it } from 'vitest'

import indexHtml from '../../experiments/index.html?raw'

/** The experiment index is a standalone page with no build step, so its manifest
 *  is embedded in the HTML rather than imported. Parsing it here is what keeps
 *  the page honest: a duplicate id, a missing protocol field or a second
 *  "current" solution fails the build instead of quietly misleading. */
// Read through Vite rather than node:fs so this file needs no node types and
// stays type-checked under the browser project's compiler options.
const html = indexHtml

/** Every source file in the app, so a target can be checked against reality. */
const fileKeys = Object.keys(
  import.meta.glob('../../src/**/*.{ts,tsx,css}', { eager: true }),
) as string[]

/** File contents, for checking that a referenced line exists. Stylesheets are
 *  deliberately absent: vitest stubs CSS under jsdom, so `?raw` yields nothing
 *  for them. CSS targets are therefore only checked for existence. */
const contents = import.meta.glob('../../src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

type Solution = {
  key: string
  status: 'current' | 'alternative' | 'rejected'
  summary: string
  hypothesis?: string
  varies?: string
  holds?: string
  evaluate?: string
  measured?: string
  target?: string
  note?: string
}

type Decision = {
  id: string
  screen: string
  open: boolean
  decision: string
  solutions: Solution[]
}

type Manifest = {
  version: number
  updated: string
  conventions: {
    prototypeUrl: string
    idPattern: string
    statuses: Record<string, string>
    rules: { say: string; means: string }[]
  }
  experiments: Decision[]
}

const extract = (): Manifest => {
  const match = html.match(
    /<script type="application\/json" id="experiment-manifest">([\s\S]*?)<\/script>/,
  )
  expect(match, 'index.html should embed a JSON manifest').not.toBeNull()
  return JSON.parse(match![1]!) as Manifest
}

const manifest = extract()

describe('experiment manifest', () => {
  it('is embedded in the page and parses', () => {
    expect(manifest.version).toBe(1)
    expect(manifest.experiments.length).toBeGreaterThan(0)
  })

  it('uses unique, well-formed decision ids', () => {
    const ids = manifest.experiments.map((d) => d.id)
    expect(new Set(ids).size, 'decision ids must be unique').toBe(ids.length)
    for (const id of ids) {
      expect(id, `id "${id}" should be screen/decision`).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/)
      const [screen, decision] = id.split('/')!
      expect(decision, `id "${id}" should name a decision`).not.toBe('')
      expect(screen).not.toBe('')
    }
  })

  it('names exactly one current solution per decision', () => {
    for (const decision of manifest.experiments) {
      const current = decision.solutions.filter((s) => s.status === 'current')
      expect(
        current.length,
        `"${decision.id}" should have exactly one current solution, found ${current.length}`,
      ).toBe(1)
    }
  })

  it('uses unique solution keys within each decision', () => {
    for (const decision of manifest.experiments) {
      const keys = decision.solutions.map((s) => s.key)
      expect(new Set(keys).size, `"${decision.id}" has duplicate solution keys`).toBe(keys.length)
    }
  })

  it('records the full protocol for every solution', () => {
    for (const decision of manifest.experiments) {
      expect(decision.solutions.length, `"${decision.id}" should list more than one option`).toBeGreaterThan(1)
      for (const solution of decision.solutions) {
        const where = `${decision.id}/${solution.key}`
        // summary, hypothesis, varies, holds and evaluate are what make an
        // entry an experiment rather than a note.
        expect(solution.summary, `${where} needs a summary`).toBeTruthy()
        expect(solution.hypothesis, `${where} needs a hypothesis`).toBeTruthy()
        expect(solution.varies, `${where} needs to say what it varies`).toBeTruthy()
        expect(solution.holds, `${where} needs to say what it holds constant`).toBeTruthy()
        expect(solution.evaluate, `${where} needs an evaluation method`).toBeTruthy()
        expect(
          ['current', 'alternative', 'rejected'],
          `${where} has an unknown status "${solution.status}"`,
        ).toContain(solution.status)
      }
    }
  })

  it('explains every rejection with a measurement or a reason', () => {
    for (const decision of manifest.experiments) {
      for (const solution of decision.solutions.filter((s) => s.status === 'rejected')) {
        expect(
          solution.measured || solution.note,
          `${decision.id}/${solution.key} is rejected without saying why`,
        ).toBeTruthy()
      }
    }
  })

  it('points the current solution at real code', () => {
    for (const decision of manifest.experiments) {
      const current = decision.solutions.find((s) => s.status === 'current')!
      const target = current.target ?? ''
      expect(target, `"${decision.id}" should record where its current solution lives`).toMatch(
        /^src\/[\w./-]+:\d+$/,
      )
      const [file, line] = target.split(':')
      // import.meta.glob keys are relative to this file, so they carry a
      // leading "../" and no "src/". Match on the src-relative suffix rather
      // than assuming an exact prefix.
      const relative = file.replace(/^src\//, '')
      const key = fileKeys.find((k) => k.endsWith(relative))
      expect(key, `"${target}" should name a real source file`).toBeDefined()
      if (key === undefined || relative.endsWith('.css')) continue
      const source = contents[key] ?? ''
      expect(Number(line), `"${target}" should point at a line that exists`).toBeLessThanOrEqual(
        source.split('\n').length,
      )
    }
  })

  it('documents the addressing rules the page teaches', () => {
    expect(manifest.conventions.idPattern).toBe('screen/decision')
    for (const status of ['current', 'alternative', 'rejected']) {
      expect(manifest.conventions.statuses[status], `status "${status}" should be defined`).toBeTruthy()
    }
    const says = manifest.conventions.rules.map((r) => r.say)
    // At least one worked example must show the two-segment form, and at least
    // one must show how to name a single solution rather than a whole decision.
    expect(says.some((s) => /\b[a-z0-9-]+\/[a-z0-9-]+/.test(s)), 'no example uses the screen/decision form').toBe(true)
    expect(says.some((s) => /\b[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+/.test(s)), 'no example names a single solution').toBe(true)
    for (const rule of manifest.conventions.rules) {
      expect(rule.means, `"${rule.say}" should say what it means`).toBeTruthy()
    }
  })

  it('only teaches rules that address decisions that exist', () => {
    const ids = new Set(manifest.experiments.map((d) => d.id))
    const solutionIds = new Set(
      manifest.experiments.flatMap((d) => d.solutions.map((s) => `${d.id}/${s.key}`)),
    )
    for (const rule of manifest.conventions.rules) {
      // Pull out anything that looks like an id being addressed.
      for (const mentioned of rule.say.match(/[a-z0-9-]+(?:\/[a-z0-9-]+){1,2}/g) ?? []) {
        expect(
          ids.has(mentioned) || solutionIds.has(mentioned),
          `rule "${rule.say}" addresses "${mentioned}", which is not in the manifest`,
        ).toBe(true)
      }
    }
  })

  it('links the current prototype from the page', () => {
    const url = manifest.conventions.prototypeUrl
    expect(url, 'the page needs one url for the built prototype').toBeTruthy()
    expect(url, 'the prototype link should be absolute').toMatch(/^https?:\/\//)
    // The header carries the link, and every current solution repeats it, so a
    // reader can get to the running app from any decision.
    expect(html, 'the header should link to the prototype').toContain('id="prototype-link"')
    expect(html, 'current solutions should link to the prototype').toContain('open the current prototype')
    const currents = manifest.experiments.flatMap((d) => d.solutions.filter((s) => s.status === 'current'))
    expect(currents, 'the manifest should have current solutions to link from').toHaveLength(
      manifest.experiments.length,
    )
  })

  it('covers the screens the product actually ships', () => {
    const screens = new Set(manifest.experiments.map((d) => d.screen))
    for (const screen of ['Data View', 'Left pane', 'Graph', 'Shell', 'Design system']) {
      expect(screens, `no decision recorded for ${screen}`).toContain(screen)
    }
  })
})
