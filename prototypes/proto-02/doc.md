# Proto 02 — Provenance you can check

## Status

Planned. Not built. This document states what the next prototype is for, so the intent survives
until it is built and can be argued with in the meantime.

## Research question

Inherited from [Proto 01](/prototypes/proto-01/doc.html): does making the relationship between an answer's
claims and their supporting evidence explicit improve human verification of AI-generated answers?

Proto 02 does not ask a new question. It asks the first one properly.

## Hypothesis

Not yet defined. Proto 01's hypothesis is untested and may not survive contact with a user, so
Proto 02's hypothesis depends on what the baseline sessions actually show.

## Context

Proto 01 answered thirteen questions about how the interface should look and one about what state it
should open in. None was answered by watching a person use it.

That is the gap this prototype closes. The premise of the product is that someone arrives with a
number they do not trust and leaves able to check it. Nothing in Proto 01 establishes that anyone
does that, or that the three-pane layout is the reason they would.

## Research protocol

### Participants

Not yet defined. The plan is five moderated sessions per question. No participants recruited.

### Task

Not yet defined. Each question is asked against a single case, one question at a time.

### Conditions

Baseline first, change second, compare third. Baseline is the current build, unchanged.

### Measures

Not yet defined. Each measure is chosen from the baseline, not in advance: a redesign applied
before the baseline is known produces a number that cannot be interpreted, because there is nothing
to compare it to.

## Prototype

### Goal

Change what the product does, not how it looks.

### Interface

Unchanged from Proto 01 by design. The three panes, the shared selection, the case model, and the
fictional data all stay fixed, so any difference in the numbers is attributable to behaviour rather
than to a different design.

### Evidence model

Unchanged. See `shared/evidence-model.md`: Question → Answer → Claim → Evidence → Source.

## Cases

The three Proto 01 cases, unchanged.

## Variations

Eight behavioural questions. Each one's first option is instrumentation — run the current build,
record what people actually do, change nothing — and its second option is the smallest change that
might move the measured number.

| Question | Why it matters |
| --- | --- |
| Does anyone trace a claim back to its source without being told to? | The premise of the whole product. If verification does not happen unprompted, the layout is solving a problem people do not have. |
| What does someone do first when this opens? | Whatever the first action is, that is the real entry point. The layout assumes it is the Question pane, and that assumption has never been checked. |
| What does someone do when the chart and the source text disagree? | The case the product exists for. If people resolve it wrongly, and do so confidently, the interface is not protecting them from anything. |
| Do people tell "unverified" apart from "contradicted"? | These are not the same claim about the world. If the interface cannot make them feel different, the distinction the model is built on is decoration. |
| Is the shared selection understood in both directions? | The central idea of Proto 01. It only works if people can predict it, so the number worth measuring is the surprise rate, not the selection rate. |
| Can someone rank the sources by size without reading the labels? | A funnel is a ranking. If the order cannot be read off it without labels, the encoding is not doing the work and the labels are carrying it instead. |
| What does switching between cases cost someone? | The three cases share a model, so switching should be cheap. Only measurement will show whether it is. |
| What does someone do with a claim that has no evidence at all? | There is no empty state, because the local data is always complete. Real claim sets are not, and nobody has seen the interface handle it. |

## Design decisions

None yet. This prototype is not expected to introduce visual changes; if it does, that is a
confound and should be argued for explicitly.

## Observations

None. Nothing has been run.

## Findings

**None. No research has been conducted.**

## Limitations

- The entire protocol is unwritten. Every section above marked "not yet defined" is a decision that
  has not been made.
- The question list is a hypothesis about what matters, derived from reading the interface rather
  than from observing anyone use it. It may be measuring the wrong things.
- Five sessions per question is a small sample and will not support statistical claims. It is
  intended to find out whether a behaviour happens at all, not how often.

## Next experiment

Not yet defined.

## Changelog

- Research plan written down before building, so the intent can be argued with.
- Documentation restructured to the shared research format.
