import { describe, expect, it } from 'vitest'

import indexHtml from '../../experiments/index.html?raw'

/** The experiment workbench is a standalone page with no build step, so its
 *  manifest is embedded in the HTML rather than imported. Parsing it here is
 *  what keeps the page honest: a duplicate id, a missing rationale or a stale
 *  code reference fails the build instead of quietly misleading a reader. */
const html = indexHtml

/** Every file a version's doc link can point at. */
const docs = import.meta.glob('../../experiments/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

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
  status: 'shipped' | 'untested' | 'rejected'
  summary: string
  hypothesis?: string
  intervention?: string
  controlled?: string
  method?: string
  result?: string
  target?: string
  note?: string
}

type Decision = {
  id: string
  screen: string
  question: string
  dimension: string
  open?: boolean
  openNote?: string
  solutions: Solution[]
}

type Measurement = { decision: string; before: string; after: string }

type Version = {
  id: string
  name: string | null
  status: 'current' | 'superseded' | 'planned'
  summary?: string
  prototypeUrl: string | null
  doc: string | null
  openQuestions?: number
  userResearch: { status: string; method?: string | null; notes?: string }
  buildMeasurements: Measurement[]
  decisions: Decision[]
}

type Manifest = {
  version: number
  updated: string
  conventions: {
    prototypeUrl: string
    idPattern: string
    prototypeStatuses: Record<string, string>
    solutionStatuses: Record<string, string>
    evidenceKinds: Record<string, string>
    dimensions: Record<string, string>
    protocol: { question: string; fields: { name: string; means: string }[] }
    rules: { say: string; means: string }[]
  }
  prototypes: Version[]
}

const extract = (): Manifest => {
  const match = html.match(
    /<script type="application\/json" id="experiment-manifest">([\s\S]*?)<\/script>/,
  )
  expect(match, 'index.html should embed a JSON manifest').not.toBeNull()
  return JSON.parse(match![1]!) as Manifest
}

const manifest = extract()
const shipped = manifest.prototypes.filter((p) => p.status === 'current')
const allDecisions = manifest.prototypes.flatMap((p) =>
  p.decisions.map((d) => ({ proto: p, decision: d })),
)

describe('experiment workbench', () => {
  it('is embedded in the page and parses', () => {
    expect(manifest.version).toBe(2)
    expect(manifest.prototypes.length, 'a workbench with no versions is not a workbench').toBeGreaterThan(0)
  })

  it('names versions uniquely and keeps exactly one current', () => {
    const ids = manifest.prototypes.map((p) => p.id)
    expect(new Set(ids).size, 'version ids must be unique').toBe(ids.length)
    for (const id of ids) {
      expect(id, `version id "${id}" should look like proto1`).toMatch(/^proto\d+$/)
    }
    expect(shipped.length, `exactly one version should be current, found ${shipped.length}`).toBe(1)
  })

  it('gives every version a name, a summary and a status worth keeping', () => {
    for (const proto of manifest.prototypes) {
      expect(manifest.conventions.prototypeStatuses[proto.status], `"${proto.id}" has status "${proto.status}"`).toBeTruthy()
      expect(proto.summary, `"${proto.id}" should say what this version is`).toBeTruthy()
      if (proto.status === 'planned') {
        // A version that does not exist yet must not claim to have run.
        expect(proto.prototypeUrl, `"${proto.id}" is planned, so it has nothing to link to`).toBeNull()
      } else {
        expect(proto.name, `"${proto.id}" should be named`).toBeTruthy()
      }
    }
  })

  it('points each built version at a prototype and a doc that exist', () => {
    for (const proto of manifest.prototypes) {
      if (proto.status !== 'planned') {
        expect(proto.prototypeUrl, `"${proto.id}" should link to its prototype`).toMatch(/^https?:\/\//)
      }
      // A planned version can still have a document: stating what it will test
      // is the point of writing it down before building it.
      if (!proto.doc) continue
      const key = Object.keys(docs).find((k) => k.endsWith(proto.doc!.split('/').pop()!))
      expect(key, `the doc for "${proto.id}" (${proto.doc}) should exist in experiments/`).toBeDefined()
    }
  })

  it('uses unique, well-formed decision ids inside each version', () => {
    for (const proto of manifest.prototypes) {
      const ids = proto.decisions.map((d) => d.id)
      expect(new Set(ids).size, `"${proto.id}" has duplicate decision ids`).toBe(ids.length)
      for (const decision of proto.decisions) {
        const where = `${proto.id}/${decision.id}`
        expect(decision.id, `id "${decision.id}" should be screen/decision`).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/)
        expect(decision.screen, `${where} should say which screen it belongs to`).toBeTruthy()
        expect(decision.question, `${where} should be phrased as a question`).toBeTruthy()
      }
    }
  })

  it('repeats the same decisions in each built version, so results stay comparable', () => {
    const built = manifest.prototypes.filter((p) => p.status !== 'planned' && p.decisions.length)
    if (built.length < 2) return
    const [first, ...rest] = built.map((p) => new Set(p.decisions.map((d) => d.id)))
    for (const ids of rest) {
      expect([...ids].sort(), 'every built version should carry the same decision ids').toEqual([...first].sort())
    }
  })

  it('tags every decision with what it is about', () => {
    for (const { proto, decision } of allDecisions) {
      const where = `${proto.id}/${decision.id}`
      expect(
        manifest.conventions.dimensions[decision.dimension],
        `${where} is tagged "${decision.dimension}", which is not a known dimension`,
      ).toBeTruthy()
    }
    // The point of the dimension is to separate what a person does from how it
    // looks, so both kinds have to actually be in use.
    const used = new Set(allDecisions.map(({ decision }) => decision.dimension))
    expect(used.has('behaviour'), 'no decision is tagged as behavioural').toBe(true)
    expect(used.size, 'every decision being the same kind of question is not a taxonomy').toBeGreaterThan(1)
  })

  it('ships one option per decision in a built version, and none in a planned one', () => {
    for (const proto of manifest.prototypes) {
      for (const decision of proto.decisions) {
        const where = `${proto.id}/${decision.id}`
        const built = decision.solutions.filter((s) => s.status === 'shipped')
        if (proto.status === 'planned') {
          expect(built.length, `${where} is planned, so nothing can be shipped in it yet`).toBe(0)
        } else {
          expect(
            built.length,
            `${where} should have exactly one shipped option, found ${built.length}`,
          ).toBe(1)
        }
      }
    }
  })

  it('uses unique solution keys within each decision', () => {
    for (const { proto, decision } of allDecisions) {
      const keys = decision.solutions.map((s) => s.key)
      expect(new Set(keys).size, `"${proto.id}/${decision.id}" has duplicate solution keys`).toBe(keys.length)
    }
  })

  it('records the protocol for every option, and no result for an untested one', () => {
    const required = ['hypothesis', 'intervention', 'controlled', 'method'] as const
    for (const { proto, decision } of allDecisions) {
      expect(decision.solutions.length, `"${proto.id}/${decision.id}" should list more than one option`).toBeGreaterThan(1)
      for (const solution of decision.solutions) {
        const where = `${proto.id}/${decision.id}/${solution.key}`
        expect(solution.summary, `${where} needs a summary`).toBeTruthy()
        for (const field of required) {
          expect(
            solution[field],
            `${where} needs a ${field}: ${manifest.conventions.protocol.fields.find((f) => f.name === field)?.means}`,
          ).toBeTruthy()
        }

        if (solution.status === 'untested') {
          // The important one: an option nobody has tried must not carry a
          // result, or the workbench starts asserting things nobody measured.
          expect(
            solution.result,
            `${where} is untested, so it must not claim a result`,
          ).toBeFalsy()
        } else {
          expect(solution.result, `${where} is ${solution.status}, so it needs the result that got it there`).toBeTruthy()
        }
      }
    }
  })

  it('explains every rejection with evidence, not just an opinion', () => {
    for (const { proto, decision } of allDecisions) {
      for (const solution of decision.solutions.filter((s) => s.status === 'rejected')) {
        expect(
          solution.result,
          `${proto.id}/${decision.id}/${solution.key} was rejected, so the reason and the evidence must be recorded`,
        ).toBeTruthy()
      }
    }
  })

  it('points every shipped option at real code', () => {
    for (const { proto, decision } of allDecisions) {
      const built = decision.solutions.find((s) => s.status === 'shipped')
      if (!built) continue
      const target = built.target ?? ''
      expect(target, `"${proto.id}/${decision.id}" should record where its shipped option lives`).toMatch(
        /^src\/[\w./-]+:\d+$/,
      )
      const [file, line] = target.split(':')
      // import.meta.glob keys are relative to this file, so they carry a
      // leading "../" and no "src/". Match on the suffix rather than guessing.
      const relative = file!.replace(/^src\//, '')
      const key = fileKeys.find((k) => k.endsWith(relative))
      expect(key, `"${target}" should name a real source file`).toBeDefined()
      if (key === undefined || relative!.endsWith('.css')) continue
      const source = contents[key] ?? ''
      expect(Number(line), `"${target}" should point at a line that exists`).toBeLessThanOrEqual(
        source.split('\n').length,
      )
    }
  })

  it('keeps user research honest about not having been collected', () => {
    for (const proto of manifest.prototypes) {
      const r = proto.userResearch
      expect(manifest.conventions.evidenceKinds['user-session'], 'user sessions should be a known evidence kind').toBeTruthy()
      if (r.status === 'not-collected') {
        // No claims, but the method to collect it should be spelled out.
        expect(r.notes ?? '', `"${proto.id}" has no user research, so it should not assert findings`).toBeFalsy()
      }
      if (r.status === 'collected') {
        expect(r.notes, `"${proto.id}" claims user research, so it needs notes to back that up`).toBeTruthy()
      }
    }
  })

  it('records build measurements against decisions that exist in that version', () => {
    for (const proto of manifest.prototypes) {
      const ids = new Set(proto.decisions.map((d) => d.id))
      for (const m of proto.buildMeasurements) {
        expect(ids.has(m.decision), `a measurement in "${proto.id}" points at "${m.decision}", which is not one of its decisions`).toBe(true)
        expect(m.before, `the measurement for "${m.decision}" should say what it was`).toBeTruthy()
        expect(m.after, `the measurement for "${m.decision}" should say what it became`).toBeTruthy()
      }
    }
  })

  it('documents the addressing rules the page teaches', () => {
    expect(manifest.conventions.idPattern).toBe('proto/screen/decision')
    for (const status of ['shipped', 'untested', 'rejected']) {
      expect(manifest.conventions.solutionStatuses[status], `status "${status}" should be defined`).toBeTruthy()
    }
    for (const field of manifest.conventions.protocol.fields) {
      expect(field.means, `protocol field "${field.name}" should say what it means`).toBeTruthy()
    }
    const says = manifest.conventions.rules.map((r) => r.say)
    expect(says.some((s) => /proto\d+\/[a-z0-9-]+\/[a-z0-9-]+/.test(s)), 'no example addresses a decision in a version').toBe(true)
    expect(says.some((s) => /proto\d+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+/.test(s)), 'no example names a single option').toBe(true)
  })

  it('only teaches rules that address things which exist', () => {
    const versionIds = new Set(manifest.prototypes.map((p) => p.id))
    const decisionIds = new Set(allDecisions.map(({ proto, decision }) => `${proto.id}/${decision.id}`))
    const solutionIds = new Set(
      allDecisions.flatMap(({ proto, decision }) =>
        decision.solutions.map((s) => `${proto.id}/${decision.id}/${s.key}`),
      ),
    )
    for (const rule of manifest.conventions.rules) {
      for (const mentioned of rule.say.match(/\bproto\d+(?:\/[a-z0-9-]+){1,2}/g) ?? []) {
        expect(
          versionIds.has(mentioned) || decisionIds.has(mentioned) || solutionIds.has(mentioned),
          `rule "${rule.say}" addresses "${mentioned}", which is not in the manifest`,
        ).toBe(true)
      }
    }
  })

  it('keeps a standing set of behavioural questions, and none of them answered by guesswork', () => {
    // Behaviour is the thing a redesign cannot answer, so it has to stay
    // visible as a standing list rather than being buried in a version.
    const behavioural = allDecisions.filter(({ decision }) => decision.dimension === 'behaviour')
    expect(behavioural.length, 'there should be behavioural questions on the workbench').toBeGreaterThan(0)

    // An open question is one with nothing shipped yet. A behavioural decision
    // that has already shipped is a decision, not an open question, so the
    // research discipline below applies to the open ones.
    const open = behavioural.filter(({ decision }) => !decision.solutions.some((s) => s.status === 'shipped'))
    expect(open.length, 'there should be behavioural questions still waiting to be answered').toBeGreaterThan(0)

    for (const { proto, decision } of open) {
      const where = `${proto.id}/${decision.id}`
      expect(decision.openNote, `${where} should say why the question matters`).toBeTruthy()
      for (const solution of decision.solutions) {
        expect(
          solution.method,
          `${where}/${solution.key} is behavioural, so it needs a method someone could actually run`,
        ).toBeTruthy()
        expect(
          solution.result,
          `${where}/${solution.key} is behavioural, so it must not carry a result until it is observed`,
        ).toBeFalsy()
      }
    }
  })

  it('makes the first move on an open behavioural question a measurement, not a redesign', () => {
    const open = allDecisions.filter(
      ({ decision }) =>
        decision.dimension === 'behaviour' && !decision.solutions.some((s) => s.status === 'shipped'),
    )
    for (const { proto, decision } of open) {
      expect(
        decision.solutions[0]!.key,
        `${proto.id}/${decision.id} should start by instrumenting, so a later change has a baseline to be compared against`,
      ).toBe('instrument-baseline')
    }
  })

  it('keeps a planned version to declaring questions, with no results yet', () => {
    const plannedVersions = manifest.prototypes.filter((p) => p.status === 'planned')
    expect(plannedVersions.length, 'there should be a version to build next').toBeGreaterThan(0)
    for (const proto of plannedVersions) {
      expect(proto.decisions.length, `"${proto.id}" should state the questions it exists to answer`).toBeGreaterThan(0)
      expect(proto.buildMeasurements.length, `"${proto.id}" is planned, so it should have no measurements yet`).toBe(0)
      for (const decision of proto.decisions) {
        for (const solution of decision.solutions) {
          expect(solution.result, `"${proto.id}/${decision.id}/${solution.key}" is planned, so it has no result`).toBeFalsy()
        }
      }
    }
  })

  it('offers the untested options of the current version as the next things to try', () => {
    const from = shipped[0]!
    const untested = from.decisions.flatMap((d) => d.solutions.filter((s) => s.status === 'untested'))
    expect(untested.length, 'there should be something left to try').toBeGreaterThan(0)
    // Every inherited candidate has to be addressable by a full id.
    for (const s of untested) {
      expect(s.key).toBeTruthy()
    }
  })
})
