/** What the right-hand detail panel is showing. */
export type Selection = { kind: 'summary' } | { kind: 'signal'; id: string } | { kind: 'link'; url: string } | { kind: 'steps' } | { kind: 'questions' };

export const SUMMARY: Selection = { kind: 'summary' };
