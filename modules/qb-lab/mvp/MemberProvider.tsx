"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MemberData, MemberProfile, MemberRole } from './types';
export async function memberApi(operation:string,input?:object,signal?:AbortSignal){
 const response=await fetch(`/api/qb-lab/mvp/${operation}`,{credentials:'same-origin',cache:'no-store',signal,...(input?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}:{})});
 const data=await response.json();if(!response.ok)throw new Error(data.code??'REQUEST_UNAVAILABLE');return data;
}
type MemberState={account:{id:string;role:MemberRole}|null;profiles:MemberProfile[];profile:MemberProfile|null;select:(id:string)=>void;data:MemberData|null;loading:boolean;error:string;gates:{media:boolean;onboarding:boolean};reload:()=>Promise<void>;refreshSession:()=>Promise<void>};
const Context=createContext<MemberState|null>(null);
export function useMember(){const value=useContext(Context);if(!value)throw new Error('Verified membership context required');return value;}
export function MemberProvider({children}:{children:ReactNode}){
 const [account,setAccount]=useState<MemberState['account']>(null);
 const [profiles,setProfiles]=useState<MemberProfile[]>([]);
 const [selected,setSelected]=useState('');
 const selectedRef=useRef('');
 const [data,setData]=useState<MemberData|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [gates,setGates]=useState({media:false,onboarding:false});
 const select=useCallback((id:string)=>{
  if(selectedRef.current===id)return;
  selectedRef.current=id;setData(null);setError('');setLoading(Boolean(id));setSelected(id);
 },[]);
 const refreshSession=useCallback(async()=>{
  const result=await memberApi('session');
  setAccount(result.account);setProfiles(result.profiles);setGates(result.gates);
  const next=result.profiles.some((p:MemberProfile)=>p.id===selectedRef.current)?selectedRef.current:result.profiles[0]?.id??'';
  select(next);
 },[select]);
 useEffect(()=>{
  let live=true;const controller=new AbortController();
  memberApi('session',undefined,controller.signal).then(result=>{
   if(!live)return;
   setAccount(result.account);setProfiles(result.profiles);setGates(result.gates);
   select(result.profiles[0]?.id??'');if(!result.profiles.length)setLoading(false);
  }).catch(()=>{if(live){setError('Your account could not be verified. Sign in again; no cached personal records are displayed.');setLoading(false);}});
  return()=>{live=false;controller.abort();};
 },[select]);
 useEffect(()=>{
  if(!selected)return;
  let live=true;const controller=new AbortController();
  memberApi(`data?athlete=${encodeURIComponent(selected)}`,undefined,controller.signal)
   .then(result=>{if(live){setData(result);setError('');}})
   .catch(()=>{if(live){setData(null);setError('Private records could not be loaded. Please retry or sign in again.');}})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;controller.abort();};
 },[selected]);
 const reload=useCallback(async()=>{
  if(!selected)return;
  setError('');
  try{const result=await memberApi(`data?athlete=${encodeURIComponent(selected)}`);if(selectedRef.current===selected)setData(result);}
  catch(error){if(selectedRef.current===selected){setData(null);setError('Private records could not be refreshed.');}throw error;}
 },[selected]);
 return <Context.Provider value={{account,profiles,profile:profiles.find(p=>p.id===selected)??null,select,data,loading,error,gates,reload,refreshSession}}>{children}</Context.Provider>;
}
