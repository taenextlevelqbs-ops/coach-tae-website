import { render,screen } from '@testing-library/react';
import { beforeEach,expect,it,vi } from 'vitest';
const mock=vi.hoisted(()=>({member:vi.fn()}));
vi.mock('@/modules/qb-lab/mvp/MemberProvider',()=>({useMember:mock.member,memberApi:vi.fn()}));
import { MemberHome } from '@/modules/qb-lab/mvp/MemberHome';
import { MemberTraining } from '@/modules/qb-lab/mvp/MemberTraining';
import { MemberFilm } from '@/modules/qb-lab/mvp/MemberFilm';
import { MemberLibrary } from '@/modules/qb-lab/mvp/MemberLibrary';
import { workoutBySlug } from '@/modules/qb-lab/training/workouts';
beforeEach(()=>mock.member.mockReturnValue({profile:{id:'synthetic',display_name:'Synthetic athlete'},profiles:[],account:{role:'athlete'},data:null,loading:false,error:'Database unavailable',gates:{media:false,onboarding:false},reload:async()=>{}}));
it('never substitutes a fabricated next session or coaching note when private data fails',()=>{
 render(<MemberHome/>);expect(screen.getByText(/No progress or next session is assumed/)).toBeVisible();expect(screen.queryByRole('link',{name:'Start Training'})).not.toBeInTheDocument();
});
it('locks completion and upload controls when authoritative history is unavailable',()=>{
 const {container}=render(<><MemberTraining item={workoutBySlug('reset-your-feet')!}/><MemberFilm/></>);
 expect(screen.queryByRole('button',{name:'Start Drill'})).not.toBeInTheDocument();expect(container.querySelector('input[type=file]')).toBeNull();expect(screen.getByText(/Saving remains disabled/)).toBeVisible();
});
it('distinguishes unavailable history from a real Not Started state',()=>{
 render(<MemberLibrary kind="workout"/>);expect(screen.queryByText(/Not Started/)).not.toBeInTheDocument();expect(screen.getAllByText(/History unavailable/)).toHaveLength(24);
});
it('does not call an unrelated legacy task a coach-assigned workout',()=>{
 mock.member.mockReturnValue({profile:{id:'synthetic',display_name:'Synthetic athlete',pathway:'flag5',age_group:'under13'},account:{role:'athlete'},data:{training:[],messages:[],quizzes:[],films:[],tasks:[{id:'legacy',content_version:'old-observation-task',completed_at:null,title:'Legacy observation'}]},loading:false,error:'',reload:async()=>{}});
 render(<MemberHome/>);expect(screen.getByText('Your next step')).toBeVisible();expect(screen.queryByText('Coach assigned',{exact:true})).not.toBeInTheDocument();expect(screen.getAllByRole('link').filter(link=>link.classList.contains('training-destination'))).toHaveLength(4);
});
