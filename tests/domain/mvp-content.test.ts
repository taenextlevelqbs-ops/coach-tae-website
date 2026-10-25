import { expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { questionDrafts } from '@/server/qb-lab/mvp/question-drafts';
import { workouts } from '@/modules/qb-lab/training/workouts';
import { recoveryExercises } from '@/modules/qb-lab/training/recovery';
it('separates ten flag and ten tackle starter questions with four distinct choices and valid explanations',()=>{
 for(const pathway of ['flag','tackle'])expect(questionDrafts.filter(q=>q.pathway===pathway)).toHaveLength(10);
 expect(new Set(questionDrafts.map(q=>q.key)).size).toBe(20);
 for(const q of questionDrafts){expect(new Set(q.choices).size).toBe(4);expect(q.correct).toBeGreaterThanOrEqual(0);expect(q.correct).toBeLessThan(4);expect(q.explanation.length).toBeGreaterThan(30);expect(q.source_url).toMatch(/^https:\/\/(nflflag\.com|operations\.nfl\.com)\//);expect(q.difficulty).toBe('foundation');}
 expect(questionDrafts.find(q=>q.key==='flag-rush')!.prompt).toContain('NFL FLAG');
 expect(questionDrafts.find(q=>q.key==='flag-rules')!.choices).toContain('Check the actual league rulebook with your coach');
});
it('keeps catalog/answer seed versions synchronized while leaving every starter unapproved',()=>{
 const sql=readFileSync('db/migrations/006_qb_lab_content_drafts.sql','utf8');
 expect((sql.match(/insert into public.qb_training_catalog/g)??[]).length).toBe(34);
 expect((sql.match(/insert into public.qb_question_bank/g)??[]).length).toBe(20);
 expect(sql).not.toContain('reviewed_at');
 for(const q of questionDrafts){expect(sql).toContain(q.key);expect(sql).toContain(q.source_url);expect(sql).toContain(JSON.stringify(q.choices).replaceAll("'","''"));}
 for(const item of [...workouts,...recoveryExercises])expect(sql).toContain(`${item.kind}:${item.slug}`);
});
