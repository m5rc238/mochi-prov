# Proto 01 — Evidence Graph, version 2

Version 2 of this record adds the study protocol. Version 1 documents the built prototype; this
version documents the experiment that has been designed against it. The prototype itself is unchanged,
and the two records are kept side by side rather than merged, because the point of the study is to
measure the interface version 1 describes.

- [Version 1 of this record](/prototypes/proto-01/doc.html)
- [The evidence model this prototype renders](/shared/evidence-model.html)

## Status

Protocol designed. **Not yet run.** No participant has seen any condition, including the prototype's
own author.

The implementation is version 1's, running at `/prototypes/proto-01/app/`. Nothing in the study
protocol required a code change, and none was made. The two cases the study needs that the
prototype does not yet have are recorded as build work in [Limitations](#limitations).

## Research question

Does making the relationship between an answer's claims and its supporting evidence explicit improve
human verification of AI-generated answers?

## Hypothesis

The design hypothesis, unchanged from version 1: if every claim in an answer is decomposed into
discrete assertions, and each assertion carries a verbatim quote from a named source, then a reader
can verify the answer without re-reading the source document from the beginning.

That is a hypothesis about a mechanism. It is not the same as a testable prediction, and the
protocol below does not treat it as one. A reader may be handed a perfectly explicit claim-to-evidence
chain and still accept a wrong answer, because the structure looks like verification. That failure is
named, measured, and preregistered as H3.

## Context

A reader arrives with a number they do not trust. The answer states it. The question is whether
showing *how* the number is supported changes what the reader does next.

The full conceptual model is `shared/evidence-model.md`: Question → Answer → Claim → Evidence →
Source. Proto 01 is an interface for inspecting that model, not a claim that the model is correct.

The condition this prototype is being tested against is the one readers already meet: a paragraph
number beside a sentence, and nothing else. That condition is B, and it is included because a result
measured only against no citations at all would not tell us whether the interface is worth its cost.

## Research protocol

### Grounding in existing work

- **Liu et al. 2023, "Evaluating Verifiability in Generative Search Engines."** Audited Bing Chat,
  Perplexity, and others. About half of generated sentences were fully supported by their citations,
  and roughly three quarters of citations supported their sentence. Citations exist but often fail to
  verify the claim. This is the baseline failure rate the study is working against.
- **Bansal et al. 2021, "Does the Whole Exceed its Parts?"** AI explanations raised acceptance of AI
  advice whether or not the advice was correct. **This is the main risk for Proto 01:** structure can
  look like verification, and an interface that raises confidence in wrong answers is worse than one
  that does nothing.
- **Buçinca et al. 2021, "To Trust or to Think."** Cognitive forcing functions reduced overreliance
  more than plain explanations did. Not part of this study; it is the candidate change for
  [Proto 02](/prototypes/proto-02/doc.html).
- **Rashkin et al. 2021, Attributable to Identified Sources (AIS).** The annotation framework for "is
  this statement supported by the source." Its wording is used verbatim for the verdict task, so the
  labels in this study mean what they mean in the AIS literature.
- **Existing products as the citation baseline.** Perplexity and Bing Chat use numbered links at
  sentence or paragraph level. NotebookLM shows passage-level citations in the source. Condition B is
  modelled on that, not invented.

The four references are recorded here by author, year, and title as they were supplied to this
record. They have not been checked against the papers. Full references with DOIs must be added
before preregistration; a protocol that cites a finding it cannot point at is not preregisterable.

### Hypotheses

- **H1:** Claim-level evidence with verbatim spans (C) increases detection of unsupported causal
  steps, compared with paragraph-level citations (B) and a plain answer (A).
- **H2:** C reduces time to a correct verdict, and reduces the amount of source read before the
  verdict.
- **H3 (the competing hypothesis):** C raises trust equally on correct and incorrect answers, so
  calibration does not improve. This is the Bansal result. **The study must be able to show it**, and
  the decision rule is written so that H3 is a reportable result rather than a failure of the study.

### Conditions

Between-subjects: each participant sees one interface condition for all five cases.

| Condition | Answer | Support shown | Source |
| --- | --- | --- | --- |
| A. Plain | One sentence | None | Full document, no highlights |
| B. Cited | One sentence | Paragraph-level citation links, Perplexity style | Full document, cited paragraph highlighted |
| C. Proto 01 | One sentence + claims | Claim → evidence → verbatim span, three panes, shared selection | Exact span highlighted |

The graph view is **off in all three conditions** for the main study. It is the least justified
element of the interface, so it is tested separately rather than carried into a between-subjects
comparison where it would confound the claim-to-evidence effect with the cost of a second rendering.

### Case set and order

The three planted overclaims from version 1, plus two clean controls, so that over-scepticism is
measurable and not merely assumed away.

- **Cases 1 to 3** carry a planted unsupported step: case 1's "primarily because" against a source
  paragraph that explicitly declines to identify a single driver; case 2's redesign-caused-everything
  reading; case 3's causal reading of the two-group chart.
- **Case 4** has a fully supported answer. It is a false-alarm control: a reader who flags
  unsupported claims in cases 1 to 3 and also flags case 4 is not detecting, they are pattern-matching
  for something wrong.
- **Case 5** has a partly supported answer where the unsupported part is a **numeric detail, not a
  cause**. It separates two things case 1 to 3 conflate: noticing that a number is not in the source
  is a different ability from noticing that a causal step is unsupported.

Each participant sees all five cases in a Latin-square order, so case order cannot explain an
effect. Each participant sees exactly one interface condition.

### Participants

Recruit through Prolific for the main study and UserInterviews for the pilot. Screen for people who
read business or research documents at work.

| Stratum | Target share | Why |
| --- | --- | --- |
| Finance and business analysts | 25% | Read revenue reviews and check numbers daily |
| Researchers and academics | 25% | Trained source-checkers, likely ceiling on detection |
| Product and ops managers | 25% | Consume summaries, rarely re-read sources |
| Other knowledge workers | 25% | Baseline for a general reader |

**Exclusions:** has seen the prototype, works in AI or UX research, fails the attention check, or is
not fluent in English, because the sources are English prose. Prior use of AI answer tools with
citations is asked about and recorded as a covariate.

**Sample.** Run a pilot of 6 (2 per condition, think-aloud) to fix the task wording and catch
defects. Then run the main study with 20 per condition: 60 participants, 5 cases each, 300 verdicts.
Analyse with mixed-effects logistic regression, with random intercepts for participant and for case.

**This is sized for large effects, and the write-up must say so.** A simple two-group comparison of
30% against 60% detection needs about 42 participants per arm, so 20 per arm can miss a moderate
effect. The mixed-effects model is more efficient than that simple comparison but does not change
what is detectable. A null result here is evidence about large effects, not evidence of no effect,
and it must not be reported as the latter.

### Task

For each case, participants see the question and the answer, and must:

1. Rate each claim as supported, partly supported, or not supported by the source, using the AIS
   wording.
2. Give an overall verdict on the one-sentence answer.
3. Point to the paragraph that supports or contradicts it.
4. Rate confidence from 1 to 5.

Participants are told the document is fictional and that answers may contain errors, with no hint
about where the errors are. Conditions A and B receive the same claim-rating form, with the claims
listed as text only, so that the form is not itself a condition difference.

### Measures

| Type | Measure | How |
| --- | --- | --- |
| Primary | Overclaim detection | Binary: flagged the planted unsupported step (cases 1 to 3) |
| Primary | Overall verdict accuracy | Match to authored ground truth, all five cases |
| Secondary | Span accuracy | Named paragraph matches ground truth |
| Secondary | False alarm rate | Flagged an unsupported claim in cases 4 and 5 |
| Secondary | Calibration | Brier score of confidence against correctness |
| Secondary | Reliance | Accepted the answer when it was wrong |
| Behavioral | Time to first verdict | Logged |
| Behavioral | Source coverage before verdict | Scroll depth and paragraphs in view; operationalises "without re-reading from the beginning" |
| Behavioral | Caveat exposure | Whether P4 was on screen before the verdict |
| Self-report | Trust in the answer | 7-point scale, asked before and after inspection |
| Self-report | Usability and workload | SUS and raw NASA-TLX |

### Decision rule

Written before running, so the result cannot be reinterpreted afterwards:

**H1 holds if C beats both A and B on overclaim detection without a higher false alarm rate on cases
4 and 5.** If C only raises trust, record H3.

The second clause is not a formality. An interface that detects more overclaims *and* flags more
clean cases has not improved verification; it has changed how often people say "no", and that is the
outcome this study most needs to be able to rule out.

### Qualitative layer

Run the pilot and 8 follow-up interviews, drawn evenly from the main study, as think-aloud sessions.

- **Script probes:** "What made you decide?", "Where did you look first?", "What would you need to
  see to change your mind?"
- **Code for:** cases where participants used the chips as proof of support, which is the
  cue-versus-content failure. Also code whether they read the caveat, whether they understood "on
  path", and what they did with a claim that had no evidence.

### Predictions to preregister

- C beats A on detection, but the C versus B gap is smaller than expected, because B already
  surfaces the paragraph.
- Analysts and managers benefit most from C. Researchers are near ceiling in every condition.
- Trust rises in C on the clean cases (the good outcome) and on the trap cases (the bad outcome).
- Time drops in C, but detection depends on whether P4 was seen. This is a content problem the
  interface does not fix on its own.

## Prototype

### Goal

Let a reader follow one claim from the answer down to the exact span of text that supports it, and
back again, without losing their place.

### Interface

Three panes, left to right:

- **Question** — the question, the one-sentence answer, and the answer's claims with their evidence.
- **Data View** — a chart or table of the plotted values, every value traceable to an evidence item.
  The view shown depends on the case.
- **Source** — the source document, with the exact quoted span highlighted.

The panes are not independent. Selecting a claim or an evidence item in one pane selects the matching
entities in the other two. The three always agree, because they read from one shared selection rather
than three copies of it.

The centre pane can also show the provenance graph — the same model drawn as nodes and edges rather
than as panes. Both are renderings of the same data. The graph is excluded from all three study
conditions; see [Conditions](#conditions).

### Evidence model

```text
Question
   ↓
Answer
   ↓
Claim
   ↓
Evidence
   ↓
Source
```

`Evidence` items are quotes that appear **verbatim** inside a source paragraph. This is what makes
"jump to the exact source text" exact rather than approximate, and it is enforced by the test suite
rather than by convention. Cases 4 and 5 will be held to the same constraint.

### What condition C is, precisely

For the study, condition C is the version 1 interface with the graph view off. Nothing else changes
between the version 1 build and condition C. If a defect found during the pilot is fixed, the fix is
recorded in [Changelog](#changelog) and applied to all three conditions where it is not specific to
C, so a pilot fix cannot silently become a condition difference.

## Cases

Five are needed by the protocol. Three exist in the prototype; two do not yet. All are fictional: no
real company, product, or study is described anywhere in the material.

| Case | Question | Ground truth | Built |
| --- | --- | --- | --- |
| 1 — Revenue decline | Why did Q3 revenue decline? | Supported: enterprise subscription revenue fell 18%, from $18.6M to $15.2M (P1), and large customers reduced contract value (P2). **Unsupported:** "primarily because" — P4 states the review does not identify a single driver. | Yes |
| 2 — Product adoption | What changed after the onboarding redesign? | Supported: the flow was simplified from six steps to three (P1) and activation rose from 42% to 57% (P2). **Unsupported:** that the redesign caused the whole change — P2 records the change without attributing it, P3 states signups were flat so traffic is not the explanation, and P4 excludes pre-redesign accounts and dates the ship mid-period. | Yes |
| 3 — Follow-up and adherence | What difference was observed between the two groups? | Supported: Group A received weekly follow-up sessions (P1) and reported higher adherence, 78% against 64% (P2). **Unsupported:** any causal reading — P3 records alternating, not random, assignment from one pool. The Data View is annotated to report the difference without attributing it. | Yes |
| 4 — Fully supported | Not yet authored | Every step of the answer is verbatim supported, and the answer contains no causal step. | **No** |
| 5 — Partly supported | Not yet authored | The unsupported part is a numeric detail, not a cause. | **No** |

Case 3 carries a medical disclaimer in the prototype and must keep it. The measure is about
recognising an unsupported causal step, not about producing a clinical conclusion.

## Observations

Build measurements, taken from the running app while building it. These are the only measurements
that exist, and none of them is evidence about a person.

| What | Before | After |
| --- | --- | --- |
| Trend line SVG width | 116px inside a 603px plot, line offset by up to 406px | SVG matches plot width exactly |
| Funnel bar overflow | Series overflowed the card edge | All five series inside the card, across all three cases |
| Gap between section heading and content | 0px | 4px, with the Evidence block's internal spacing deliberately held at 8px |
| Data View initial selection | Did not match the case's default selection | Derived from `defaultSelectionFor` |
| Documented type roles vs the CSS | Tokens and roles duplicated across the app and the catalog, with the heading role and mesh rule defined twice or not at all | One `shared/tokens.css`; the app's built CSS lost no rule and no declaration, with three arbitrary utilities retired into named roles |
| Cases available for the study | 3 | 3 — cases 4 and 5 specified in this record, still to be authored |

The last two rows are from consolidating the design system into one file. They are recorded here
because the record is where build state is written down, and because "we tidied the CSS" is not a
research finding and must not be mistaken for one when this record is read later.

## Findings

**No user research has been conducted. No findings are recorded.**

The protocol above is a prediction, not a result. Nothing in it has been observed, and the table
below is empty because the study has not been run — not because the results were unhelpful.

| Preregistered prediction | A | B | C | Observed |
| --- | --- | --- | --- | --- |
| Overclaim detection, cases 1 to 3 | | | | |
| False alarm rate, cases 4 and 5 | | | | |
| Overall verdict accuracy | | | | |
| Span accuracy | | | | |
| Time to first verdict | | | | |
| Source coverage before verdict | | | | |
| Caveat exposure (P4 seen) | | | | |
| Calibration, Brier score | | | | |
| Trust in the answer, before and after | | | | |
| SUS and NASA-TLX | | | | |

Every cell in that table is empty, and every one of them is a measurement nobody has taken.

The design hypothesis in this record has never been tested against a person. Version 1 recorded that
the prototype was visually settled and behaviourally untested; that is still true, and this version
does not change it. What changed is that the untested thing now has a design, a decision rule, and
an empty results table.

## Limitations

Carried forward from version 1:

- The three-pane model has never been seen by a user, so the whole layout is unvalidated.
- The funnel is the most complex element and the least verified.
- The evidence is fictional. Nothing here demonstrates the model works on real answers, and the
  verbatim-quoting constraint is untested against messy real sources.
- Reduced motion is implemented but has never been observed with the preference actually enabled.
- Three cases is enough to exercise the model and not enough to generalise from.

Added by this version:

- **Empty, loading, and error states are untested**, and they do not exist. The local data is always
  complete, and the three conditions all assume a fully loaded document.
- **No claim without evidence has been shown to anyone.** The interface has never had to render a
  claim that nothing supports, which is one of the states the study's qualitative layer explicitly
  plans to ask about.
- **Cases 4 and 5 do not exist yet.** Two of the five cases in the protocol, and the whole false-alarm
  measure, depend on material that is specified here and not yet authored in `cases.ts`. The pilot
  cannot fix task wording without them, because a false-alarm rate cannot be observed without a clean
  case.
- **The power calculation constrains what a result can mean.** 20 per arm is sized for large effects.
  A null result would be evidence about large effects only, and reporting it as "no difference" would
  be a misreading of the design.
- **The literature grounding is unverified.** Four references are recorded by author, year, and title
  only. No finding has been checked against the paper it is attributed to.
- **Recruitment is a convenience sample** from two panels, screened for people who read business or
  research documents at work. It is not a sample of the general public, and the study does not claim
  to be.
- **An untested-state task is owed after the main study**, not before it: a claim with zero evidence,
  and a claim with contradicting evidence. Both are states the current data cannot produce.

## Next experiment

> **Superseded in part.** [Proto 02](/prototypes/proto-02/doc.html) has since been built, and as a
> chat surface rather than as the behavioural research programme. Condition C below is no longer the
> only "graph on" instrument available, and the question this section asks of Proto 02 has been
> overtaken: the thing to decide is no longer which condition Proto 02 perturbs, but whether Proto
> 01 stays in the study at all. The text below is left as it was written, because the reasoning that
> produced it is still the reasoning that has to be answered. Nothing in this record has been run.

[Proto 02](/prototypes/proto-02/doc.html) is the behavioural research programme, and it is where the
conditions above get separated. For this protocol, Proto 02 must state two things explicitly, and
neither is currently written down:

1. **Which condition it changes.** A claim-to-evidence structure is not one variable. Proto 02 has to
   name the single condition it perturbs relative to C, or a difference in the numbers will be
   unattributable.
2. **Whether it adds a forcing function** (the Buçinca result) **or a support-status label.** These
   are different interventions with different mechanisms, and the audit noted the support-status
   label as untested. Choosing both at once would repeat the confounding this study is built to
   avoid.

The rule both records follow is **measure before changing anything**: baseline first, change second,
compare third.

## Ethics and data

- **Consent** is taken before the task, in the participant's own words: what is being asked, that the
  documents are fictional, that the session is recorded, and that they may stop at any point.
- **No personal data beyond two covariates:** stratum, and prior use of AI answer tools with
  citations. No names, no email addresses, no employer, no free-text about the participant.
- **Fair pay** at a standard Prolific rate for the time taken. The think-aloud sessions are longer
  and are paid at the same hourly rate as the main study, not less.
- **Logging is behavioural only** — scroll position and click events — and is disclosed in the consent
  form rather than buried in a policy page. The log exists to answer the behavioral measures in this
  record and is not joined to any other data.
- **The material is fictional.** No real person's data, no real clinical or business record, and no
  real study is described to participants. Case 3's medical disclaimer is shown, not summarised.
- **Analysis code and the decision rule are fixed before data is collected**, so the rule cannot be
  rewritten once the numbers are visible.

## Changelog

Version 2. The prototype is unchanged; this record is not.

- Study protocol added: grounding in existing work, hypotheses H1 to H3, three between-subjects
  conditions, case set and order, recruitment and sample, task, measures, decision rule, qualitative
  layer, and preregistered predictions.
- Design hypothesis separated from the testable hypotheses, and the competing hypothesis (H3)
  promoted from a caveat to a reportable result with its own decision-rule clause.
- Power limitation stated: 20 per arm is sized for large effects, and a null result must be reported
  as such.
- Cases 4 and 5 specified, including the constraint that the unsupported part of case 5 is a numeric
  detail rather than a cause, and both recorded as not yet built.
- Limitations extended with untested empty, loading, and error states; the never-shown claim without
  evidence; the unbuilt cases; the unverified references; and the convenience sample.
- Empty results table added for the preregistered predictions, so the absence of findings is visible
  rather than implied.
- Ethics and data section added: consent, the two covariates, fair pay, disclosed behavioural logging,
  and the fictional material.
- Next experiment specified as a requirement on Proto 02: name the single condition it changes, and
  choose between a forcing function and a support-status label rather than both.
