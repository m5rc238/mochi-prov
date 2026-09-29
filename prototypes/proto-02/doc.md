# Proto 02 — Ask

## Status

Built. Running at `/prototypes/proto-02/app/`.

This is the second instrument. It is a working prototype, not a study: the study design has not
been written, and nothing here has been run with a participant. See [Next experiment](#next-experiment).

## Research question

Inherited from [Proto 01](/prototypes/proto-01/doc.html): does making the relationship between an
answer's claims and their supporting evidence explicit improve human verification of AI-generated
answers?

Proto 02 does not ask a new question. It asks the first one properly.

## Hypothesis

Not yet defined. Proto 01's hypothesis is untested and may not survive contact with a user, so
Proto 02's hypothesis depends on what the baseline sessions actually show.

The interface below is not an expression of a hypothesis. It is a change of instrument, and
building it commits to nothing about which version is better.

## Context

Proto 01 answered thirteen questions about how the interface should look and one about what state it
should open in. None was answered by watching a person use it.

That is the gap this prototype closes. The premise of the product is that someone arrives with a
number they do not trust and leaves able to check it. Nothing in Proto 01 establishes that anyone
does that, or that the three-pane layout is the reason they would.

## Research protocol

Not yet defined. The prototype exists so there is something to point a participant at; the protocol
that would make the result mean anything is still unwritten.

### Participants

Not yet defined. The plan is five moderated sessions per question. No participants recruited.

### Task

Not yet defined. Each question is asked against a single case, one question at a time.

### Conditions

Not yet defined.

### Measures

Not yet defined. Each measure is chosen from the baseline, not in advance: a redesign applied
before the baseline is known produces a number that cannot be interpreted, because there is nothing
to compare it to.

## Prototype

### Goal

Change what the product is, not how it looks.

### Why the chat form

The research instrument backbone was Proto 01's three-pane explorer, and the plan was to run the
study on it. That has changed. The instrument is now a chat surface, and the reason is worth writing
down because it is a claim about the product rather than about the study.

A three-pane explorer is a tool for someone who has already decided the provenance is worth their
time. It opens by showing the machinery — question, answer, claims, graph, source — all at once, at
equal weight, and it asks the reader to be an inspector from the first second. That is a reasonable
thing to build when you want to demonstrate the model, and a poor default for the question the
product is actually for, which is *someone who has not yet decided whether to trust an answer*.

The chat form is what the product will actually be. So the prototype has to be that, or the study
measures a tool that will not ship. Getting there is not a repaint:

- The user arrives at a clean screen with one field and nothing else, instead of three panes
  competing for attention.
- They ask, and they get prose back. Not a panel, not a table of claims — an answer.
- The provenance is *signalled* rather than shown. Enough to know it is there and worth checking.
- Clicking a claim opens the evidence graph beside the conversation, and the source document opens
  beside that. Neither ever covers the conversation.

The consequence is the part that matters for the research, and it is not a visual one. In Proto 01
the evidence is always on screen, so a reader is looking at the provenance whether they intend to or
not. Here it arrives on request. **The evidence becomes progressive.** That changes what the study
would be comparing: not "evidence versus no evidence" but "evidence immediately versus evidence
behind a click", and the rate at which people take that click becomes a measured quantity rather
than a property of the layout.

That reframing is deliberately *not* written into the protocol yet. It is a consequence to be
argued about before it becomes a design, and the protocol stays unwritten until it is.

### Interface

| Part | What it is |
| --- | --- |
| Arrival | A clean screen: the mark, one line, and the type field. No answer, no evidence, no claims. |
| Type field | A text field is the real control. There is no model behind it, so it holds the questions the demo can answer, drawn as a field. It says so underneath. |
| Send | Disabled while a reply is in flight, so one question cannot be asked twice by accident. |
| Reply | Prose. An accent rule at the left, the same answer treatment as Proto 01. |
| Provenance signal | One dot per claim, and a count of how many trace to the source. Quiet, and not a control. |
| Claims | The way in. Each states how many spans support it *before* it is clicked, and a claim with nothing behind it says "no evidence linked" rather than implying support. |
| Evidence column | Proto 01's centre workspace, unchanged, beside the conversation: the evidence graph and the data view as tabs. |
| Source column | The source document, beside the evidence. There is no control that opens it: selecting a piece of evidence in the column beside it is what reveals it, and a reader who never touches a span never gets one. |

### Why the panes open to the right

Checked against current LLM behaviour rather than assumed. The products that put provenance next
to a generated answer converge on a side panel, not a drawer: Perplexity and Google's AI
Overviews surface a vertical sources panel on the right of the answer on desktop, and both attach
an inline anchor to each claim — a numbered bracket in Perplexity, a link chip in Google's case — so
the route from a claim to its source is the same short step in both. ChatGPT is the outlier and
uses a collapsible list at the bottom of the answer, and Claude puts its list at the top. So the
right-hand column is the mainstream choice, and the inline claim-to-passage anchor is the idiom this
is borrowing.

Two places this departs from those products, on purpose:

- **The step count.** They go straight from the claim to the passage. This prototype spends one
  extra step on the graph, because the chain is the object under study rather than a means of
  reaching a citation. That is a research instrument, not a product decision, and it is the thing
  most worth watching a participant get wrong.
- **The two columns coexist.** The graph and the source are open at the same time, which no major
  product does. A participant checking a claim can see the chain and the passage it rests on without
  choosing between them, which keeps the check from being a navigation.

There is deliberately no "show source" control in the evidence column. A button there would be a
second way into the same place, it would sit on the graph's own row, and it would let a reader open
the passage without having touched anything in it — which is the check this layout is built to
invite. Selecting a span is the same short step the products above use, and it is the only one.

Each column carries a single dismiss control, drawn as an icon on the column rather than as a
labelled button. On the source it sits above the document panel, not inside the panel's header: the
panel is a rendering of the source, and a control that closes the *column* does not belong inside the
thing it is closing.

Escape backs out one column at a time, and closing the evidence column closes the source with it, so
the workspace empties right to left rather than leaving a source with nothing to explain. Selecting a
different claim returns to the first step, because a new claim is a new question.

### What is unchanged, and why

- **The evidence model.** Unchanged. See `shared/evidence-model.md`: Question → Answer → Claim →
  Evidence → Source.
- **The case material.** The three Proto 01 cases, unchanged, and the same `cases.ts` the other
  prototypes import.
- **The graph and the source document.** Proto 01's own components, used as they are. Their styling
  moved to `shared/evidence-panes.css` because two prototypes now render them, but neither pane was
  redesigned.

The reason for sharing rather than copying is the study. Every condition has to put the identical
material in front of a participant; two copies of the cases would drift, and a difference in the
results would be uninterpretable. The same is true of the panes.

The visual system is defined in `design.md`, and this prototype is held to it.

## Cases

The three Proto 01 cases, unchanged: the Q3 revenue decline, the onboarding redesign, and the
follow-up adherence comparison.

Case 4 (the clean control) and case 5 (the claim with no evidence at all) are still not built. The
chat form makes the missing one more expensive, not less: a claim list whose every row says
"supported" teaches the reader that the list is decorative, and the one case that would prove
otherwise does not exist yet.

## Variations

The questions Proto 01 raised, plus the ones the chat form creates. Each one's first option is
instrumentation — run the current build, record what people actually do, change nothing — and its
second option is the smallest change that might move the measured number.

| Question | Why it matters |
| --- | --- |
| Does anyone trace a claim back to its source without being told to? | The premise of the whole product. If verification does not happen unprompted, the layout is solving a problem people do not have. |
| What does someone do first when this opens? | Whatever the first action is, that is the real entry point. Proto 01 assumed the Question pane and was never checked; the chat form now assumes the field. |
| Is the provenance signal noticed at all? | "Subtle" is a design intention, not a measurement. A signal nobody perceives is not a subtle signal, it is a missing affordance, and this is the failure mode most likely to be invisible from the inside. |
| Does clicking a claim change what someone believes about the answer? | The click is the whole mechanism of this prototype. If reading the evidence does not move anyone's confidence, neither does making it easier to reach. |
| What does someone do when the chart and the source text disagree? | The case the product exists for. If people resolve it wrongly, and do so confidently, the interface is not protecting them from anything. |
| Do people tell "unverified" apart from "contradicted"? | These are not the same claim about the world. If the interface cannot make them feel different, the distinction the model is built on is decoration. |
| Is the shared selection understood in both directions? | The central idea of Proto 01, and it survives into the columns. It only works if people can predict it, so the number worth measuring is the surprise rate, not the selection rate. |
| Can someone rank the sources by size without reading the labels? | A funnel is a ranking. If the order cannot be read off it without labels, the encoding is not doing the work and the labels are carrying it instead. |
| What does switching between cases cost someone? | The cases share a model, so switching should be cheap. Only measurement will show whether it is. |
| What does someone do with a claim that has no evidence at all? | The interface says "no evidence linked" rather than inventing support, but no participant has seen it and the local data is always complete. |

## Design decisions

- **The answer is prose, and the provenance is underneath it.** Not beside it. A reader who is
  deciding whether to trust an answer is not helped by being shown the audit at the same time; they
  are helped by being told, quietly, that there is one.
- **The signal is not the control.** The dots say that checking is possible. The claims below are
  what you click. If the dots were the target, the affordance would be six pixels wide.
- **A claim states its own support before it is opened.** The count is on the row, not only in the
  column, because a reader who has to click to discover that a claim is unsupported has already been
  misled.
- **The columns are beside the conversation, not over it.** The answer stays on screen and keeps its
  place, narrowing rather than being covered. The check is a detour, not a navigation.
- **The panes arrive in order and in that order only.** Evidence, then source. A reader who never
  asks for the source never gets one, so the cost of not checking stays at one click rather than at
  two.
- **The panes were not redesigned.** The graph and the source document are Proto 01's, untouched. The
  change under test is the conversation around them; changing the panes too would confound it.
- **The composer admits what it is.** A control drawn as a text field that only accepts three fixed
  options is a lie about the product, and this prototype is a research instrument.

## Observations

None. Nothing has been run.

## Findings

**None. No research has been conducted.**

## Limitations

- The entire protocol is unwritten. Every section above marked "not yet defined" is a decision that
  has not been made.
- The instrument changed after the study design was framed, and the design has not caught up. The
  protocol that would compare conditions still assumes Proto 01 is the instrument; if it is run as
  written, it will be measuring a prototype that is no longer the one in the study.
- The field is a list of three fixed questions, so nothing is known about how the interface behaves
  when a question has no good answer, when there are several, or when the user rephrases.
- There are no empty, loading or error states. The pending state is three dots.
- "Subtle" is unvalidated. If the signal is too quiet to be seen, the prototype has removed the
  affordance without replacing it, and only observation will show that.
- The question list is a hypothesis about what matters, derived from reading the interface rather
  than from observing anyone use it. It may be measuring the wrong things.
- Five sessions per question is a small sample and will not support statistical claims. It is
  intended to find out whether a behaviour happens at all, not how often.

## Next experiment

Not yet defined. The first decision is not a measure, it is whether the protocol keeps Proto 01 as
the comparison or is rewritten around disclosure timing.

## Changelog

- Prototype built: a chat surface whose evidence opens on demand, reusing Proto 01's graph, source
  document and case material unchanged.
- Retitled from "Provenance you can check" to "Ask", because the prototype is now a specific
  interface rather than a research programme, and the old title described neither.
- Rationale for leaving the three-pane form written down, including the consequence for the study:
  the evidence is now progressive.
- Design decisions and the questions the chat form creates recorded.
- Evidence moved from a bottom drawer to two right-hand columns that open in order: the evidence
  graph, then the source. Checked against current LLM provenance layouts first — a side panel is
  what Perplexity and Google do, a bottom list is ChatGPT's outlier — and the departure from all of
  them (spending a step on the graph before the passage) recorded as a research-instrument choice.
- The evidence column widened to 42vw and the source to 26vw, giving the panes the majority of the
  screen, after both were found too cramped. The graph holds its zoom at 0.72 rather than shrinking
  to fit, so width buys legibility or it buys panning — there is no width at which a narrow graph is
  merely smaller. The conversation takes what is left, which at 1310px leaves its prose near 48
  characters a line: tight, and the honest cost of the split.
- Removed from the evidence header: a "show source" toggle. The source is reached only by selecting
  evidence.
- Both dismiss controls are icon-only and sit on the column rather than inside the pane, the source's
  moving out of the document panel's own header.
