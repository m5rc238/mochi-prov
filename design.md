# Design System: Colors & Fonts

## 1. Google Fonts

### Primary Typography
* **Cormorant Garamond**
  * **Category:** Serif
  * **Weights:** `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold)
  * **Usage:** Editorial quote displays, longform literary text, excerpts, historical context labels.

* **Space Mono**
  * **Category:** Monospace
  * **Weights:** `400` (Regular), `700` (Bold)
  * **Usage:** Widget section headers, uppercase metadata labels, technical timestamps, distance metrics.

* **Plus Jakarta Sans**
  * **Category:** Sans-Serif
  * **Weights:** `400` (Regular), `500` (Medium), `600` (Semi-Bold), `700` (Bold)
  * **Usage:** Clean UI numeric displays, metric titles, body captions, chart legends, interactive UI elements.

---

## 2. Color Palettes

### Palette A: Editorial / Literary Theme
* **Canvas Background:** `#FAF7F2` (Warm Off-White / Cream)
* **Text Primary:** `#1A1A1A` (Charcoal Black)
* **Text Muted:** `#6E6E6E` (Neutral Gray)
* **Highlight Accents:**
  * **People (Pink):** `#F4B8D5`
  * **Places (Mint):** `#A4E7D0`
  * **Things (Periwinkle):** `#C5CEF8`
* **Connectors & Dividers:** `#B5B5B5` (Dashed gray line)

### Palette B: Atmospheric / Dark Interface Theme
* **Canvas Background:** `#1E1E20` (Dark Matte Slate)
* **Card Surface:** `#F2F2F3` (Soft Light Gray)
* **Text Primary:** `#0D0D0E` (Deep Black)
* **Text Secondary:** `#52525B` (Slate Gray)
* **Text Muted:** `#A1A1AA` (Light Slate)
* **Indicator Status Colors:**
  * **Scarlet Red:** `#FF5A5F`
  * **Warm Orange:** `#FFB347`
  * **Soft Lavender:** `#B39DDB`
  * **Sky Blue:** `#90CAF9`

### Mesh & Bar Gradients
* **Header Atmosphere Mesh Gradient:**
  * `linear-gradient(135deg, #FFA07A 0%, #F4A261 35%, #E8A5C8 70%, #A5C4F0 100%)`
* **Progress Bar Pill Gradient:**
  * `linear-gradient(90deg, #F9E79F 0%, #B8C0FF 60%, #D6E4FF 100%)`

---

## 3. Implementation Decisions

> **Added during implementation.** Sections 1–2 define colours and fonts but stop
> short of spacing, radii, borders, surfaces, a type scale, and interaction
> states. The product could not be built consistently without them, so the gaps
> below were resolved as follows. They are now the system's rules — promote any
> of them into sections 1–2 if they are meant to outlast this build.

### 3.1 Active palette
* **Palette A is the application surface.** The product is a reading and
  inspection tool, so the warm off-white canvas carries the longform source
  text and quoted evidence.
* **Palette B contributes indicator colours only** (scarlet, orange, lavender,
  sky) and is otherwise unused. Shipping both palettes as a theme switch was
  rejected: nothing in the brief called for a theme control.

### 3.2 Surfaces
| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#FAF7F2` | App background, gutters |
| `--color-surface` | `#FFFDFA` | Panels and cards |
| `--color-sunken` | `#F2ECE2` | Inset wells, plot areas, table stripes |

### 3.3 Spacing
* **4px base scale.** Gaps are multiples of 4: `4` hairline separations, `8`
  chip-to-label, `12` pane gutters, `16` panel padding, `20` section rhythm,
  `24` between major blocks.
* **Panel padding is 16px**; the space between panes is 12px; the app gutter is
  12px. Nothing in the system uses a gap that is not a multiple of 4.
* **A section heading sits 4px above the content it labels** (`.ds-section-heading`).
  A 10px uppercase mono label flush against 21–23px serif copy reads as one
  crowded block rather than as a label introducing content. Applied to
  Question, Answer and Claims. A label that *follows* content keeps its own
  spacing instead — the `Evidence` row inside a claim card stays at 8px.

### 3.4 Borders, radii, elevation
* **No shadows anywhere.** Separation is carried by hairline rules and surface
  tint, which is what keeps the editorial canvas calm.
* **Rules:** `1px solid`, `#B5B5B5` at 60% opacity. A dashed `#B5B5B5` line is
  reserved for graph edges and "not yet traced" relationships.
* **Radii:** `2px` chips and tags, `4px` cards and panels, `9999px` pills and
  bar tracks. Nothing is rounder than a pill.
* **Focus ring:** `2px` solid ink at 55%, `2px` offset — the only ring in the
  system, applied via `:focus-visible` on every interactive element.

### 3.5 Type scale
Roles, mapped onto the three families in section 1:

| Role | Family | Size / leading | Use |
| --- | --- | --- | --- |
| `ds-display` | Cormorant Garamond 500 | fluid, tight | Question, answer, source document body, source title |
| `ds-body` | Plus Jakarta Sans 400 | `14px` / `1.5` | Evidence and claim text, graph node copy |
| `ds-caption` | Plus Jakarta Sans 400 | `11px` / `1.45` | Supporting notes, source citations |
| `ds-label` | Space Mono 400 | `10px`, `0.14em` tracking, uppercase | Metadata: entity ids, paragraph ids, axis labels |
| `ds-chip` | Space Mono 400 | `9px`, `0.12em` tracking, uppercase | Entity-kind and state tags |

* **Serif is for content, sans is for interface, mono is for addressing.**
  A paragraph id is an address, so it is always mono.
* Body text is never set below 14px, and uppercase mono never below 9px.

### 3.6 Accent usage
* **Accents are fills, never text.** `--color-ink` on every accent, so contrast
  holds at the pastel values in section 2.
* **Entity → accent** (applied as a 3px left bar on a node or card, and as a
  chip fill): question `#B5B5B5`, answer `#C5CEF8`, claim `#F4B8D5`, evidence
  `#A4E7D0`, source `#B5B5B5`. Source and question share the neutral rule so the
  endpoints of the provenance chain read as bookends, not as two more categories.
* **Source highlight:** a quoted span wears a mint wash; the *active* span is the
  only one that also gains a bottom rule. Selection is therefore carried by
  weight, not by a second colour.

### 3.7 Interaction states
* **Rest → hover:** 1-step surface tint (`#FFFDFA` → `#F2ECE2`) at 150ms. No
  scale, no lift, no shadow.
* **On path:** mint wash plus a left accent bar. Applies to every entity in the
  current claim-to-source path, in the graph, the claim list, the Data View and
  the source at once.
* **Off path, in the Data View:** the same brand gradient at 45% opacity. An
  off-path bar must never become a flat grey — a series belonging to the
  unselected claim still has to read as a chart rather than as something that
  failed to render. Emphasis is carried by the fill's opacity alone; the value
  labels always stay at full strength so the numbers are readable either way.
* **Selected:** ink hairline at full opacity plus the accent bar — the only
  state allowed to darken a border.
* **Active (in source):** the mint wash animates from opaque to 45% over 900ms,
  so a selection reads as a highlight settling rather than a blinking selection.
* **Reduced motion:** every transition above is removed and replaced with an
  instant state change. Selection, tracing and reveal all still happen; only the
  movement is dropped.

### 3.8 Graph fit behaviour
* The provenance graph fits its pane with `14%` padding and never zooms below
  `0.72`. Node copy is 14px, so below that it stops being legible; on a narrow
  centre pane the graph pans instead of shrinking further.
* Pane widths scale with the viewport (`clamp`) rather than sitting at fixed
  maxima, so the centre — the pane that has to hold a graph — keeps its width on
  smaller desktops.

### 3.9 Documentation typography
* **Longform research records get their own measure and body size.** Interface
  body text is `14px` because it sits inside panes competing for attention. A
  research record is read in a column, so it is `15px` at `1.7` with a `68ch`
  measure. The prototype's `14px` rule is unchanged; this is an additional role,
  not a replacement.
* **Serif still means "content".** Document titles and `h2` section headings use
  Cormorant Garamond; `h3` and below switch to Plus Jakarta Sans, because from
  `h3` down a heading is labelling a specific thing rather than opening a
  section. A reader should be able to tell section from subsection with no
  marker.
* **An `h2` opens a section and is separated from the one above it** by a
  hairline rule and `2.2em` of space. The record is scrolled, not paged, so the
  rule is what tells the reader they have left one section.
* **Headings are addressable.** Every `h2`–`h4` gets a stable slug id and a
  hover anchor, so any part of a research record can be cited. A finding that
  cannot be linked to is a finding that gets paraphrased.
* **Tables scroll, they do not reflow.** A wrapped number is a misread number,
  so a wide table gets a horizontal scroll region rather than stacking cells.
  Headers stay mono-uppercase as metadata.
* **Lists use a rule, not a disc.** `ul` markers are a 4px hairline, matching
  the system's flatness; ordered lists stay decimal because order is the
  information.
* **Accent is reserved.** A blockquote takes a periwinkle left rule, the one
  place a research record uses an accent, so quoted text is visibly not the
  author's own words.

### 3.10 Gradient use
* **The header mesh gradient is a 3px rule**, not a fill. Filling the header
  with it would out-shout the type; a hairline keeps the atmosphere and the calm.
* **The bar pill gradient fills the plotted value only.** The remaining track
  stays `--color-sunken`, so the gradient reads as magnitude rather than
  decoration.