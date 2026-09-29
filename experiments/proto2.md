# proto2 — provenance you can check

Not built. This document states what the next version is for, so the intent survives until it is
built and can be argued with in the meantime.

| | |
| --- | --- |
| Id | `proto2` |
| Status | planned |
| Baseline | [`proto1`](proto1.md) |
| Index | [experiment workbench](index.html) |

## Why this version exists

`proto1` answered thirteen questions about how the interface should look and one about what state it
should open in. Not one of them was answered by watching a person use it.

That is a real gap, and it is the gap this version closes. The premise of the product is that someone
arrives with a number they do not trust and leaves able to check it. Nothing in `proto1` establishes
that anyone does that, or that the three-pane layout is the reason they would.

So the questions below are behavioural, and none of them can be settled by looking at the screen.

## The rule this version follows

**Measure before changing anything.**

Every question's first option is instrumentation: run the current build, record what people actually
do, and only then decide whether the behaviour is a problem. A redesign applied before the baseline
is known produces a number that cannot be interpreted, because there is nothing to compare it to.

The second option on each question is the smallest change that might move the measured number.

## The questions

### Provenance

**Does anyone trace a claim back to its source without being told to?** — `provenance/unprompted-verification`

This is the premise of the whole product. If verification does not happen unprompted, the layout is
solving a problem people do not have, and no amount of visual refinement will change that.

### Entry

**What does someone do first when this opens?** — `entry/first-action`

Whatever the first action is, that is the real entry point. The layout currently assumes it is the
Question pane, and that assumption has never been checked.

### Conflict

**What does someone do when the chart and the source text disagree?** — `conflict/chart-vs-source`

This is the case the product exists for. If people resolve it wrongly, and do so confidently, the
interface is not protecting them from anything.

### Trust

**Do people tell "unverified" apart from "contradicted"?** — `trust/evidence-states`

These are not the same claim about the world. If the interface cannot make them feel different, the
distinction the model is built on is decoration.

### Selection

**Is the shared selection understood in both directions?** — `selection/bidirectional`

The shared selection is the central idea of `proto1`. It only works if people can predict it, so the
number worth measuring is the surprise rate, not the selection rate.

### Chart

**Can someone rank the sources by size without reading the labels?** — `chart/funnel-ordering`

A funnel is a ranking. If the order cannot be read off it without labels, the encoding is not doing
the work and the labels are carrying it instead.

### Case switching

**What does switching between cases cost someone?** — `case/switching-cost`

The three cases share a model, so switching should be cheap. Only measurement will show whether it
is.

### Unsupported

**What does someone do with a claim that has no evidence at all?** — `unsupported/no-evidence`

There is no empty state, because the local data is always complete. Real claim sets are not, and
nobody has seen the interface handle it.

## Method

Five moderated sessions per question, one question at a time, each against a single case. Baseline
first, change second, compare third. Every finding is recorded against the decision id in the
[workbench](index.html), so it lands beside the hypothesis it was testing rather than in a document
nobody re-reads.

## What stays fixed

The three panes, the shared selection, the case model, and the fictional data. This version changes
what the product does, not how it looks, so that any difference in the numbers is attributable to
behaviour rather than to a different design.
