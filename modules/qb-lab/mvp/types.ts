export type MemberRole = 'adult' | 'guardian' | 'athlete' | 'coach' | 'administrator';
export type MemberProfile = { id: string; display_name: string; minor: boolean; pathway: string; age_band: string; age_group: string | null; experience: string; ruleset: string | null };
export type TrainingRecord = { id: string; athlete_id: string; content_key: string; kind: 'workout' | 'recovery'; started_at: string; completed_at: string | null; source: 'self_reported' };
export type CoachMessage = { id: string; body: string; publish_at: string; task_id: string | null };
export type QuizQuestion = { id: string; prompt: string; choices: string[]; explanation?: string; correct?: number; selected?: number; source_url?: string };
export type WeeklyQuiz = { assignment: string; week: string; title: string; pathway: 'flag' | 'tackle'; ruleset: string; questions: QuizQuestion[]; score: number | null; completed_at: string | null };
export type FilmRecord = { id: string; athlete_id: string; state: string; created_at: string; retained_until: string; feedback: { id: string; note: string; released_at: string }[] };
export type MemberData = { training: TrainingRecord[]; messages: CoachMessage[]; quizzes: WeeklyQuiz[]; films: FilmRecord[]; tasks: { id: string; title: string; content_version: string; completed_at: string | null }[] };
export const isCoach = (role: MemberRole | string) => role === 'coach' || role === 'administrator';
