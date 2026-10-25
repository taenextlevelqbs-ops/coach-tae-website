"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { MemberProvider,useMember } from './MemberProvider';
import { AppIcon, type AppIconName } from '../AppIcon';
const nav:{label:string;href:string;icon:AppIconName}[]=[{label:'Home',href:'/qb-lab',icon:'home'},{label:'Train',href:'/qb-lab/workouts',icon:'train'},{label:'Simulator',href:'/qb-lab/simulator',icon:'simulator'},{label:'Profile',href:'/qb-lab/profile',icon:'profile'}];
function Content({children}:{children:ReactNode}){
 const member=useMember(),path=usePathname();
 return <div className="qb-application mvp-application"><a className="app-skip" href="#member-main">Skip to QB LAB content</a>
  <header className="public-lab-header"><Link href="/qb-lab" className="app-wordmark"><span className="app-brand-coach">COACH TAE</span><span className="app-brand-lab">QB LAB</span></Link><nav aria-label="Athlete desktop navigation">{nav.map(n=><Link key={n.href} href={n.href} aria-current={path===n.href?'page':undefined}>{n.label}</Link>)}</nav></header>
  <main id="member-main" className="mvp-main" tabIndex={-1}>
   <div className="mvp-account-bar"><span>QB LAB · synthetic staging accounts only</span>{member.profiles.length>1&&<label>Selected athlete<select value={member.profile?.id??''} onChange={e=>member.select(e.target.value)}>{member.profiles.map(p=><option key={p.id} value={p.id}>{p.display_name}</option>)}</select></label>}</div>
   {member.error&&<p role="alert">{member.error}</p>}{children}
  </main>
  <nav className="app-navigation app-bottom-nav" aria-label="Athlete mobile navigation">{nav.map(n=><Link key={n.href} href={n.href} className={path===n.href?'active':''} aria-current={path===n.href?'page':undefined}><AppIcon name={n.icon}/><span>{n.label}</span></Link>)}</nav>
 </div>;
}
export function MemberShell({children}:{children:ReactNode}){return <MemberProvider><Content>{children}</Content></MemberProvider>;}
