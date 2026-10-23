/** Synthetic, memory-only walkthrough. These role choices are NOT authentication. */
export const demoAthletes = [
  { id: 'demo-jordan', name: 'Jordan (synthetic)', age: 'Under 13', pathway: 'Flag', guardian: true },
  { id: 'demo-alex', name: 'Alex (synthetic)', age: '18+', pathway: 'Tackle', guardian: false },
] as const;
export const messageTemplates = [
  'Great work this week! Focus on your three-step drop and getting your feet set before throwing.',
  'Your new QB workout is ready. Review the draft with your coach before training.',
  'Reminder: We have a synthetic quarterback training session coming up.',
] as const;
export type DemoMessage = { id: string; athlete: string; body: string; publishAt: number; read: boolean; assignment: boolean };
export type DemoSession = { athlete: string; startsAt: number; cancelled: boolean };
export type DemoState = { sequence: number; messages: DemoMessage[]; sessions: DemoSession[]; audit: string[] };
export const emptyDemo: DemoState = { sequence: 0, messages: [], sessions: [], audit: [] };
export function sendDemo(state: DemoState, targets: string[], template: number, now: number, delay = 0, assignment = false): DemoState {
  if (!targets.length || targets.some(id => !demoAthletes.some(a => a.id === id)) || new Set(targets).size !== targets.length || !messageTemplates[template] || delay < 0) throw new Error('Invalid synthetic selection');
  return { ...state, sequence: state.sequence + targets.length, messages: [...state.messages, ...targets.map((athlete, i) => ({ id: `${now}-${state.sequence + i}`, athlete, body: messageTemplates[template], publishAt: now + delay, read: false, assignment }))].slice(-100), audit: [...state.audit, `Synthetic coach queued ${targets.length} in-app message(s)`].slice(-100) };
}
export function inboxDemo(state: DemoState, athlete: string, now: number) { return state.messages.filter(m => m.athlete === athlete && m.publishAt <= now); }
