import type { DemoCase } from './types'

/** Fictional demonstration data. No real company, product, or study is
 *  described here. Every sentence in the source documents is invented for the
 *  purpose of showing how an answer traces back to a source. */
export const DEMO_CASES: DemoCase[] = [
  {
    id: 'revenue-decline',
    title: 'Revenue decline',
    question: 'Why did Q3 revenue decline?',
    answer: 'Q3 revenue declined primarily because enterprise subscription revenue fell.',
    claims: [
      {
        id: 'C1',
        text: 'Enterprise subscription revenue declined.',
        evidenceIds: ['E1', 'E3', 'E4'],
      },
      {
        id: 'C2',
        text: 'Large enterprise customers reduced their contracts.',
        evidenceIds: ['E2'],
      },
    ],
    evidence: [
      {
        id: 'E1',
        text: 'Enterprise subscription revenue fell 18% in Q3.',
        sourceId: 'S1',
        paragraphId: 'P1',
      },
      {
        id: 'E2',
        text: 'Several large customers reduced their annual contract value.',
        sourceId: 'S1',
        paragraphId: 'P2',
      },
      {
        id: 'E3',
        text: 'Enterprise subscription revenue was $18.6M in Q2 and $15.2M in Q3.',
        sourceId: 'S1',
        paragraphId: 'P1',
      },
      {
        id: 'E4',
        text: 'Enterprise subscription revenue was $17.4M in Q1.',
        sourceId: 'S1',
        paragraphId: 'P1',
      },
    ],
    source: {
      id: 'S1',
      title: 'Northwind Internal — Q3 Business Review',
      section: 'Fictional internal quarterly business review',
      paragraphs: [
        {
          id: 'P1',
          text: 'Total Q3 revenue was $52.4M. Enterprise subscription revenue fell 18% in Q3. Enterprise subscription revenue was $18.6M in Q2 and $15.2M in Q3. Enterprise subscription revenue was $17.4M in Q1. Self-serve subscriptions grew 4% over the same period, partially offsetting the decline.',
          evidenceIds: ['E1', 'E3', 'E4'],
        },
        {
          id: 'P2',
          text: 'Customer concentration remained high. Several large customers reduced their annual contract value. No single account accounted for more than 6% of Q3 revenue.',
          evidenceIds: ['E2'],
        },
        {
          id: 'P3',
          text: 'Pipeline coverage entering Q3 stood at 3.1x of the quarterly target, unchanged from Q2. Two renewals with a combined value of $2.4M moved from Q2 into Q4. The review records that move without treating it as a cause of the decline.',
        },
        {
          id: 'P4',
          text: 'Headcount in the enterprise segment was flat through the quarter. This review does not identify a single driver for the decline and recommends that the segment be re-examined before the Q4 close.',
        },
      ],
    },
    dataView: {
      type: 'revenue-trend-and-change',
      title: 'Revenue trend and enterprise subscription change',
      description:
        'Two views of the same source figures. Every plotted value is transcribed from the evidence listed beneath it, and the charts assert no cause.',
      series: [
        {
          id: 'enterprise-revenue',
          label: 'Enterprise subscription revenue',
          unit: '$M',
          kind: 'trend',
          caption: 'Reported quarterly totals, transcribed from E4 and E3.',
        },
        {
          id: 'q3-change',
          label: 'Q3 change vs. Q2',
          unit: '%',
          kind: 'bar',
          caption: 'The single percentage reported for the quarter, transcribed from E1.',
        },
      ],
      data: [
        {
          id: 'q1',
          label: 'Q1',
          value: 17.4,
          evidenceIds: ['E4'],
          seriesId: 'enterprise-revenue',
        },
        {
          id: 'q2',
          label: 'Q2',
          value: 18.6,
          evidenceIds: ['E3'],
          seriesId: 'enterprise-revenue',
        },
        {
          id: 'q3',
          label: 'Q3',
          value: 15.2,
          evidenceIds: ['E3'],
          seriesId: 'enterprise-revenue',
        },
        {
          id: 'enterprise-subscriptions',
          label: 'Enterprise subscriptions',
          value: -18,
          evidenceIds: ['E1'],
          seriesId: 'q3-change',
        },
      ],
    },
  },

  {
    id: 'product-adoption',
    title: 'Product adoption',
    question: 'What changed after the onboarding redesign?',
    answer: 'Activation increased after the onboarding flow was simplified.',
    claims: [
      {
        id: 'C1',
        text: 'The onboarding flow was simplified.',
        evidenceIds: ['E1', 'E3'],
      },
      {
        id: 'C2',
        text: 'Activation increased from 42% to 57%.',
        evidenceIds: ['E2'],
      },
    ],
    evidence: [
      {
        id: 'E1',
        text: 'The redesigned onboarding reduced the number of required steps.',
        sourceId: 'S2',
        paragraphId: 'P1',
      },
      {
        id: 'E2',
        text: 'Activation increased from 42% to 57% after the redesign.',
        sourceId: 'S2',
        paragraphId: 'P2',
      },
      {
        id: 'E3',
        text: 'The redesign cut the required onboarding steps from six to three.',
        sourceId: 'S2',
        paragraphId: 'P1',
      },
    ],
    source: {
      id: 'S2',
      title: 'Halcyon Product Analytics — Onboarding Report',
      section: 'Fictional product analytics report',
      paragraphs: [
        {
          id: 'P1',
          text: 'The redesigned onboarding reduced the number of required steps. The redesign cut the required onboarding steps from six to three. Median time to complete onboarding fell from 11 minutes to 6 minutes.',
          evidenceIds: ['E1', 'E3'],
        },
        {
          id: 'P2',
          text: 'Activation increased from 42% to 57% after the redesign. The report records the change without attributing it to a single cause.',
          evidenceIds: ['E2'],
        },
        {
          id: 'P3',
          text: 'Signups were flat across the same period, so the change in activation was not accompanied by a change in traffic volume. The report does not test further explanations.',
        },
        {
          id: 'P4',
          text: 'The redesign shipped to all new signups on 12 August. Accounts created before that date kept the previous flow and are excluded from the comparison above.',
        },
      ],
    },
    dataView: {
      type: 'before-after-comparison',
      title: 'Before and after the onboarding redesign',
      description:
        'Reported before-and-after figures for the same two measures. The comparison shows what changed; it does not establish why.',
      series: [
        {
          id: 'activation',
          label: 'Activation rate',
          unit: '%',
          kind: 'bar',
          caption: 'Both values transcribed from E2.',
        },
        {
          id: 'steps',
          label: 'Required onboarding steps',
          unit: 'steps',
          kind: 'funnel',
          caption: 'Both values transcribed from E3.',
        },
      ],
      data: [
        {
          id: 'activation-before',
          label: 'Before redesign',
          value: 42,
          evidenceIds: ['E2'],
          seriesId: 'activation',
        },
        {
          id: 'activation-after',
          label: 'After redesign',
          value: 57,
          evidenceIds: ['E2'],
          seriesId: 'activation',
        },
        {
          id: 'steps-before',
          label: 'Before redesign',
          value: 6,
          evidenceIds: ['E3'],
          seriesId: 'steps',
        },
        {
          id: 'steps-after',
          label: 'After redesign',
          value: 3,
          evidenceIds: ['E3'],
          seriesId: 'steps',
        },
      ],
    },
  },

  {
    id: 'follow-up-adherence',
    title: 'Follow-up and adherence',
    question: 'What difference was observed between the two groups?',
    answer: 'The group receiving weekly follow-up sessions showed higher adherence.',
    claims: [
      {
        id: 'C1',
        text: 'One group received weekly follow-up sessions.',
        evidenceIds: ['E1'],
      },
      {
        id: 'C2',
        text: 'That group showed higher adherence.',
        evidenceIds: ['E2', 'E3'],
      },
    ],
    evidence: [
      {
        id: 'E1',
        text: 'Participants in Group A received weekly follow-up sessions.',
        sourceId: 'S3',
        paragraphId: 'P1',
      },
      {
        id: 'E2',
        text: 'Group A had higher reported adherence than Group B.',
        sourceId: 'S3',
        paragraphId: 'P2',
      },
      {
        id: 'E3',
        text: 'Mean reported adherence was 78% in Group A and 64% in Group B.',
        sourceId: 'S3',
        paragraphId: 'P2',
      },
    ],
    source: {
      id: 'S3',
      title: 'Vantage Study Summary — Session Adherence',
      section: 'Fictional research summary — demonstration data only',
      paragraphs: [
        {
          id: 'P1',
          text: 'This summary describes a fictional demonstration dataset. Participants in Group A received weekly follow-up sessions. Group B followed the same visit schedule without the additional sessions. Both groups used the same attendance definition.',
          evidenceIds: ['E1'],
        },
        {
          id: 'P2',
          text: 'Group A had higher reported adherence than Group B. Mean reported adherence was 78% in Group A and 64% in Group B. Adherence here means the share of scheduled sessions each participant reported attending.',
          evidenceIds: ['E2', 'E3'],
        },
        {
          id: 'P3',
          text: 'Both groups were drawn from the same fictional recruitment pool and were assigned in alternating order. This summary is written for demonstration purposes and carries no clinical or diagnostic meaning.',
        },
        {
          id: 'P4',
          text: 'Reported adherence was collected once at the end of the eight-week period. No measurement was taken after the study window closed, and no claim is made here about longer-term behaviour.',
        },
      ],
    },
    dataView: {
      type: 'group-comparison',
      title: 'Group A vs Group B adherence',
      description:
        'Self-reported adherence for the two fictional groups. Group A is labelled with the follow-up schedule it received; the chart reports the difference and does not attribute it.',
      disclaimer:
        'Demonstration data. Not medical evidence, not a clinical finding, and not medical advice.',
      series: [
        {
          id: 'adherence',
          label: 'Mean reported adherence',
          unit: '%',
          kind: 'bar',
          caption: 'Both values transcribed from E3. Group A received weekly follow-up sessions (E1); Group B did not.',
        },
      ],
      data: [
        {
          id: 'group-a',
          label: 'Group A',
          value: 78,
          evidenceIds: ['E3'],
          seriesId: 'adherence',
        },
        {
          id: 'group-b',
          label: 'Group B',
          value: 64,
          evidenceIds: ['E3'],
          seriesId: 'adherence',
        },
      ],
    },
  },
]

export const DEFAULT_CASE_ID = DEMO_CASES[0]!.id
