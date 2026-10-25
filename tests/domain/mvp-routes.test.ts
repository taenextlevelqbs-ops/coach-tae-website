import { beforeEach,expect,it,vi } from 'vitest';
const m=vi.hoisted(()=>({config:vi.fn(),client:vi.fn(),verify:vi.fn(),gates:vi.fn()}));
vi.mock('@/server/qb-lab/accounts/config',()=>({accountConfig:m.config}));
vi.mock('@/server/qb-lab/accounts/session',()=>({accountClient:m.client,verifiedAccount:m.verify}));
vi.mock('@/server/qb-lab/mvp/config',()=>({mvpGates:m.gates}));
import { GET,POST } from '@/app/api/qb-lab/mvp/[...operation]/route';
import { AccountError } from '@/server/qb-lab/accounts/http';
const origin='https://stage.example',id='00000000-0000-4000-8000-000000000102';
function req(operation:string,body?:object,trusted=true){return new Request(origin+'/api/qb-lab/mvp/'+operation,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(trusted?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});}
const ctx=(operation:string)=>({params:Promise.resolve({operation:[operation]})});
beforeEach(()=>{vi.resetAllMocks();m.config.mockReturnValue({origin});m.verify.mockResolvedValue({id,role:'athlete'});m.gates.mockReturnValue({media:false,onboarding:false});});
it('refuses every account operation before reading the body when no project is configured',async()=>{
 m.config.mockReturnValue(null);for(const operation of ['training','register-profile','quiz-submit','film-intent','film-upload','film-feedback']){const r=req(operation,{child:'not read'});const response=await POST(r,ctx(operation));expect(response.status).toBe(503);expect(r.bodyUsed).toBe(false);expect(response.headers.get('cache-control')).toContain('no-store');}expect(m.client).not.toHaveBeenCalled();
});
it('rejects CSRF, unverified sessions and MFA failures independently of submitted roles',async()=>{
 expect((await POST(req('training',{},false),ctx('training'))).status).toBe(403);expect(m.client).not.toHaveBeenCalled();
 m.client.mockResolvedValue({});m.verify.mockRejectedValue(new AccountError(403,'MFA_REQUIRED'));
 expect((await GET(req('session'),ctx('session'))).status).toBe(403);
});
it('blocks media and registration before reading their sensitive JSON bodies',async()=>{
 m.client.mockResolvedValue({});for(const op of ['film-intent','film-feedback','register-profile']){const r=req(op,{data:'not read'});expect((await POST(r,ctx(op))).status).toBe(503);expect(r.bodyUsed).toBe(false);}
});
it('never accepts a client score, actor, timestamp or invalid weekly answer count',async()=>{
 const rpc=vi.fn().mockResolvedValue({data:8});m.client.mockResolvedValue({rpc});
 expect((await POST(req('quiz-submit',{assignment:id,answers:Array(10).fill(0),score:10}),ctx('quiz-submit'))).status).toBe(422);
 expect((await POST(req('quiz-submit',{assignment:id,answers:Array(9).fill(0)}),ctx('quiz-submit'))).status).toBe(422);
 expect((await POST(req('quiz-submit',{assignment:id,answers:Array(10).fill(0)}),ctx('quiz-submit'))).status).toBe(200);
 expect(rpc).toHaveBeenCalledWith('qb_submit_weekly',{target:id,answers:Array(10).fill(0)});
 expect((await POST(req('training',{athlete:id,attempt:id,contentKey:'workout:reset-your-feet',complete:true,completed_at:'fake'}),ctx('training'))).status).toBe(422);
});
it('does not let an athlete read or change the coach answer bank',async()=>{
 m.client.mockResolvedValue({});expect((await GET(req('questions'),ctx('questions'))).status).toBe(403);expect((await POST(req('question-save',{question:{},review:'forged'}),ctx('question-save'))).status).toBe(403);
});
it('supports administrator coaching actions only after the shared MFA verifier and RPC authorization',async()=>{
 const rpc=vi.fn().mockResolvedValue({data:id});m.client.mockResolvedValue({rpc});m.verify.mockResolvedValue({id,role:'administrator'});
 expect((await POST(req('question-save',{question:{prompt:'Synthetic review'},review:'Synthetic owner review'}),ctx('question-save'))).status).toBe(200);expect(m.verify).toHaveBeenCalled();expect(rpc).toHaveBeenCalledWith('qb_save_question',expect.objectContaining({review:'Synthetic owner review'}));
});
