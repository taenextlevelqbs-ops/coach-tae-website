import { test,expect,type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import { SyntheticStore,installSyntheticProvider } from './mvp/mock-provider';
test.setTimeout(180000);
test.use({actionTimeout:15000});
async function login(page:Page,role:string){await page.goto('/qb-lab/sign-in');await page.getByLabel('Email',{exact:true}).fill(`${role}@example.test`);await page.getByLabel('Password',{exact:true}).fill('synthetic-only-password');await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page).toHaveURL(/\/qb-lab$/);}
async function accessible(page:Page){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if((page.viewportSize()?.width??1280)<=760){const nav=page.getByRole('navigation',{name:'Athlete mobile navigation'});await expect(nav).toBeVisible();expect(await nav.evaluate(e=>getComputedStyle(e).position)).toBe('fixed');await expect(nav.getByRole('link')).toHaveCount(4);for(const link of await nav.getByRole('link').all()){const box=await link.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);expect(box!.width).toBeGreaterThanOrEqual(44);}}}
async function reviewAndPublish(page:Page,name:string,format:'flag'|'tackle'){
 await page.goto('/qb-lab/coach');await page.locator('.mvp-directory-row').filter({hasText:name}).getByRole('button').click();await page.locator('.mvp-directory-row').filter({hasText:name}).getByRole('checkbox').check();
 if(format==='flag'){
  await page.getByLabel('Reviewed ruleset for this athlete').fill('nfl-flag5-guide-review-required');await page.getByLabel('Actual competition / rulebook review').fill('Synthetic test review only; no real coaching approval.');await page.getByRole('button',{name:'Save reviewed ruleset'}).click();
  await expect(page.getByRole('status').last()).toContainText('Saved to the private account database.');
 }
 await page.getByRole('combobox',{name:'Question bank',exact:true}).selectOption(format);
 for(let i=0;i<10;i++){
  await page.locator('.mvp-bank-row').nth(i).getByRole('button',{name:'Review / edit question'}).click();
  const editor=page.locator('form').filter({has:page.getByRole('heading',{name:'Edit question',exact:true})});
  await editor.getByLabel('Coach review record',{exact:false}).fill('Synthetic source and age review for automated testing only.');
  await editor.getByRole('button',{name:'Save question',exact:true}).click();await expect(editor.getByRole('status')).toContainText('Question saved.');
 }
 for(let i=0;i<10;i++)await page.locator('.mvp-bank-row').nth(i).getByRole('checkbox').check();
 await page.getByRole('button',{name:'Assign reviewed weekly quiz'}).click();
 await expect(page.getByRole('status').last()).toContainText('Saved to the private account database.');
}
test('synthetic six-capability journey survives a second device and enforces family isolation',async({browser,page},testInfo)=>{
 // Browser API contract mocks + real rendered components. SQL suite separately verifies actual RLS and durable writes.
 const store=new SyntheticStore();await installSyntheticProvider(page,store);
 await login(page,'guardian');await page.goto('/qb-lab/profile');
 await page.getByLabel('Synthetic athlete nickname').fill('Casey synthetic');await page.getByRole('combobox',{name:'Pathway',exact:true}).selectOption('flag5');await page.getByRole('button',{name:'Create managed synthetic profile'}).click();
 await expect(page.getByRole('status')).toContainText('Managed synthetic profile created.');expect(store.ticketUsed).toBe(true);
 const coachContext=await browser.newContext({viewport:page.viewportSize()!});const coach=await coachContext.newPage();await installSyntheticProvider(coach,store);await login(coach,'coach');
 await reviewAndPublish(coach,'Casey synthetic','flag');
 await page.goto('/qb-lab/profile');await page.getByRole('button',{name:'Sign Out',exact:true}).click();await expect(page).toHaveURL(/\/qb-lab\/welcome$/);await login(page,'athlete');
 await expect(page.getByRole('heading',{name:"What's up, Casey synthetic!"})).toBeVisible();await accessible(page);
 await page.goto('/qb-lab/workouts/reset-your-feet');await page.getByRole('button',{name:'Start Drill',exact:true}).click();await expect(page.getByRole('status')).toContainText('Drill started.');await page.getByRole('button',{name:'Mark Drill Complete',exact:true}).click();await expect(page.getByRole('status')).toContainText('Completion saved');
 await page.goto('/qb-lab/recovery/gentle-shoulder-mobility');await page.getByRole('button',{name:'Start Routine',exact:true}).click();await page.getByRole('button',{name:'Mark Exercise Complete',exact:true}).click();await expect(page.getByRole('status')).toContainText('Completion saved');
 await page.goto('/qb-lab/iq');await expect(page.getByRole('heading',{name:'Flag Football IQ',exact:true})).toBeVisible();
 const quiz=store.quizzes[0];for(let i=0;i<10;i++){const correct=quiz.questions[i].correct!;await page.locator('.mvp-question').nth(i).getByRole('radio').nth(i<8?correct:(correct+1)%4).check();}
 await page.getByRole('button',{name:'Submit 10 answers'}).click();await expect(page.getByText('8 / 10',{exact:true})).toBeVisible();await expect(page.getByText('Review this read',{exact:true})).toHaveCount(2);await accessible(page);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:testInfo.outputPath('synthetic-weekly-quiz-review.png'),fullPage:true});
 const retake=await page.evaluate(async assignment=>{const r=await fetch('/api/qb-lab/mvp/quiz-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assignment,answers:Array(10).fill(0)})});return r.json();},quiz.assignment);expect(retake.score).toBe(8);expect(store.quizzes).toHaveLength(1);
 await page.goto('/qb-lab/profile');await page.getByRole('button',{name:'Sign Out',exact:true}).click();await expect(page).toHaveURL(/\/qb-lab\/welcome$/);
 const secondContext=await browser.newContext({viewport:page.viewportSize()!});const second=await secondContext.newPage();await installSyntheticProvider(second,store);await login(second,'athlete');await second.goto('/qb-lab/progress');
 await expect(second.getByText('Reset Your Feet',{exact:true})).toBeVisible();await expect(second.getByText('Gentle Shoulder Mobility',{exact:true})).toBeVisible();await expect(second.getByText(/8 \/ 10/)).toBeVisible();expect(store.training.filter(r=>r.completed_at)).toHaveLength(2);
 await second.goto('/qb-lab/film');
 const clip=execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=black:s=64x64:r=10','-t','1','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-movflags','frag_keyframe+empty_moov','-f','mp4','pipe:1'],{maxBuffer:1048576});
 await second.getByLabel('Choose a short MP4 clip').setInputFiles({name:'synthetic-color-only.mp4',mimeType:'video/mp4',buffer:clip});await second.getByRole('button',{name:'Submit private clip'}).click();await expect(second.getByRole('status')).toContainText('Private clip received in quarantine');await expect(second.getByText('Private · validation pending',{exact:true})).toBeVisible();
 store.processFilms(); // Simulates the separately tested processor, never a real hosted release.
 await coach.goto('/qb-lab/film');await coach.getByRole('combobox',{name:'Selected athlete',exact:true}).selectOption({label:'Casey synthetic'});await coach.getByRole('button',{name:'View private clip'}).click();await expect(coach.getByLabel('Private training clip')).toBeVisible();
 await coach.getByLabel('Private training clip').evaluate(async element=>{const video=element as HTMLVideoElement;await video.play();video.pause();});
 await coach.getByLabel('Written coaching feedback').fill('Synthetic feedback: finish with a balanced base.');await coach.getByRole('button',{name:'Save feedback & notify'}).click();await expect(coach.getByRole('status')).toContainText('Feedback saved');await coach.evaluate(()=>window.scrollTo(0,0));await coach.screenshot({path:testInfo.outputPath('synthetic-film-feedback.png'),fullPage:true});
 await coach.goto('/qb-lab/coach');await coach.locator('.mvp-directory-row').filter({hasText:'Casey synthetic'}).getByRole('button').click();await expect(coach.getByText(/2 completed training attempts/)).toBeVisible();await expect(coach.getByText(/8 \/ 10/)).toBeVisible();
 await coach.locator('.mvp-directory-row').filter({hasText:'Casey synthetic'}).getByRole('checkbox').check();await coach.getByLabel('Coaching message',{exact:true}).fill('Synthetic motivation: stay curious and keep a balanced base.');await coach.getByRole('button',{name:'Send to selected athletes & guardians'}).click();await expect(coach.getByRole('status').last()).toContainText('Saved to the private account database.');
 await second.goto('/qb-lab');await expect(second.getByText('Synthetic motivation: stay curious and keep a balanced base.',{exact:true})).toBeVisible();await accessible(second);
 await second.evaluate(()=>window.scrollTo(0,0));await second.screenshot({path:testInfo.outputPath('synthetic-account-home.png'),fullPage:true});
 await page.goto('/qb-lab/sign-in');await login(page,'guardian');await page.goto('/qb-lab/messages');await expect(page.getByText('Synthetic motivation: stay curious and keep a balanced base.',{exact:true})).toBeVisible();await page.goto('/qb-lab/film');await expect(page.getByText('Synthetic feedback: finish with a balanced base.',{exact:true})).toBeVisible();await accessible(page);
 const unrelatedContext=await browser.newContext();const unrelated=await unrelatedContext.newPage();await installSyntheticProvider(unrelated,store);await login(unrelated,'unrelated');
 const denied=await unrelated.evaluate(async athlete=>{const r=await fetch('/api/qb-lab/mvp/data?athlete='+athlete);return r.status;},store.childId);expect(denied).toBe(403);await expect(unrelated.getByText('Casey synthetic',{exact:true})).toHaveCount(0);
 await unrelatedContext.close();await secondContext.close();await coachContext.close();
});
test('tackle has a separate reviewed ten-question weekly assignment',async({browser,page})=>{
 const store=new SyntheticStore();await installSyntheticProvider(page,store);await login(page,'coach');await reviewAndPublish(page,'Alex synthetic','tackle');
 const context=await browser.newContext({viewport:page.viewportSize()!});const athlete=await context.newPage();await installSyntheticProvider(athlete,store);await login(athlete,'adult');await athlete.goto('/qb-lab/iq');
 await expect(athlete.getByRole('heading',{name:'Tackle Football IQ',exact:true})).toBeVisible();await expect(athlete.locator('.mvp-question')).toHaveCount(10);await expect(athlete.getByRole('heading',{name:'Flag Football IQ',exact:true})).toHaveCount(0);
 for(let i=0;i<10;i++)await athlete.locator('.mvp-question').nth(i).getByRole('radio').nth(store.quizzes[0].questions[i].correct!).check();
 await athlete.getByRole('button',{name:'Submit 10 answers'}).click();await expect(athlete.getByText('10 / 10',{exact:true})).toBeVisible();await context.close();
});
test('unapproved guardian registration and film consent have no input/upload bypass',async({page})=>{
 const store=new SyntheticStore();store.registrationAllowed=false;store.mediaAllowed=false;await installSyntheticProvider(page,store,'guardian');await page.goto('/qb-lab/profile');
 await expect(page.getByLabel('Synthetic athlete nickname')).toHaveCount(0);await page.goto('/qb-lab/film');await expect(page.locator('input[type=file]')).toHaveCount(0);await expect(page.getByText(/Upload locked/)).toBeVisible();await accessible(page);
});
test('sign-in cannot put credentials into a URL before hydration or with JavaScript disabled',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('http://127.0.0.1:3204/qb-lab/sign-in');
 await expect(page.getByLabel('Email',{exact:true})).toBeDisabled();await expect(page.getByLabel('Password',{exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Sign In',exact:true})).toBeDisabled();expect(await page.locator('form').getAttribute('method')).toBe('post');await expect(page.getByText('Enable JavaScript to securely sign in.')).toBeVisible();await context.close();
});
