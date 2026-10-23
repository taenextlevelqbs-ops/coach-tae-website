"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useDemo } from "../LabShell";
import { useLocalLab } from "../platform/store";
import { AppIcon } from "../AppIcon";
import { dailySession } from "./daily";
import { beginTraining, completeTraining, statusFor } from "./progress";
import { trainingReference, type TrainingItem } from "./types";
import { CoachTip, InstructionSteps, MetadataChip, MovementDiagram, TrainingHeader } from "./AthleteUI";

const subscribeSpeech = () => () => {};
const canSpeak = () => "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const noSpeech = () => false;

export function InstructionDetail({ item }: { item: TrainingItem }) {
  const { profile, pathway } = useDemo();
  const { state, message } = useLocalLab();
  const reference = trainingReference(item);
  const status = statusFor(state.activities, profile.id, reference);
  const recovery = item.kind === "recovery";
  const listHref = recovery ? "/qb-lab/recovery" : "/qb-lab/workouts";
  const [saved, setSaved] = useState<boolean | null>(null);
  const [speechKey, setSpeechKey] = useState<string | null>(null);
  const activeKey = `${profile.id}:${reference}`;
  const speaking = speechKey === activeKey;
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  const speechAvailable = useSyncExternalStore(subscribeSpeech, canSpeak, noSpeech);
  const markerId = `movement-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  useEffect(() => { beginTraining(profile.id, reference); }, [profile.id, reference]);
  useEffect(() => () => {
    if (speech.current) {
      speech.current.onend = null;
      speech.current.onerror = null;
      window.speechSynthesis?.cancel();
    }
  }, [profile.id, reference]);
  const session = dailySession(pathway);
  const index = session.findIndex(step => step.reference === reference);
  const next = index >= 0 ? session.slice(index + 1).find(step => statusFor(state.activities, profile.id, step.reference) !== "completed") : undefined;
  function listen() {
    if (!speechAvailable) return;
    if (speech.current) {
      speech.current.onend = null;
      speech.current.onerror = null;
    }
    window.speechSynthesis.cancel();
    if (speaking) { setSpeechKey(null); return; }
    const text = [item.title, item.purpose, "Starting position.", item.start, ...item.steps.map((step, i) => `Step ${i + 1}. ${step.title}. ${step.body}`), "Safety.", ...item.safety].join(" ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeechKey(null);
    utterance.onerror = () => setSpeechKey(null);
    speech.current = utterance;
    setSpeechKey(activeKey);
    window.speechSynthesis.speak(utterance);
  }
  return <article className="train-page instruction-page">
    <TrainingHeader title={item.title} subtitle={item.purpose} backHref={listHref} backLabel={recovery ? "Recovery" : "Workouts"} />
    <div className="train-metadata" aria-label="Activity details">
      <MetadataChip icon="clock">{item.duration}</MetadataChip>
      <MetadataChip>{item.dose}</MetadataChip>
      <MetadataChip>{item.equipment}</MetadataChip>
    </div>
    <div className="instruction-context">
      <span className="train-draft">Draft · coaching review pending</span>
      <span>{profile.name} · demo athlete · {status === "completed" ? "Completed" : "In Progress"}</span>
    </div>
    <p className="train-safety">{item.safety[0]} {recovery ? "Stop if anything hurts. Tell a parent or guardian and ask a qualified healthcare professional about pain or injury. This is not injury treatment." : "Stop for pain or discomfort. Younger athletes should practice with an adult's guidance."}</p>
    {item.diagram && <MovementDiagram title={item.title} diagram={item.diagram} markerId={markerId} />}
    <section className="instruction-start"><h2>Starting position</h2><p>{item.start}</p></section>
    {speechAvailable && <button className="train-listen" onClick={listen} aria-pressed={speaking}><AppIcon name="volume" />{speaking ? "Stop listening" : "Listen to Instructions"}</button>}
    <InstructionSteps steps={item.steps} />
    <CoachTip>{item.tip}</CoachTip>
    <details className="train-details"><summary>Before you begin</summary>
      <div><h3>Keep it comfortable</h3><ul>{item.safety.map(note => <li key={note}>{note}</li>)}</ul>
        <h3>Common mistakes</h3><ul>{item.mistakes.map(note => <li key={note}>{note}</li>)}</ul>
        <p>{item.reviewNote}</p>
      </div>
    </details>
    <div className="instruction-completion">
      {status === "completed" ? <>
        <div role="status" aria-label="Training completion" className="train-success"><AppIcon name="check" /><div><strong>{recovery ? "Exercise complete" : "Drill complete"}</strong><p>{saved === false || message.includes("memory only") ? "In memory only. Browser storage is unavailable; export your history before leaving." : "Saved on this device only. Not synced to an account."}</p></div></div>
        <button className="train-button train-button-secondary" disabled>{recovery ? "Mark Exercise Complete" : "Mark Drill Complete"}<AppIcon name="check" /></button>
        <Link className="train-button" href={next?.href ?? listHref}>{next ? `Next: ${next.title}` : `Back to ${recovery ? "Recovery" : "Workouts"}`}<AppIcon name="arrow" /></Link>
      </> : <>
        <button className="train-button" onClick={() => setSaved(completeTraining(profile.id, reference).persisted)}>{recovery ? "Mark Exercise Complete" : "Mark Drill Complete"}<AppIcon name="check" /></button>
        <p className="train-muted">A self-reported practice, saved in this browser only. No movement score or account sync.</p>
      </>}
      <Link className="train-back" href="/qb-lab/session">See today’s training →</Link>
    </div>
  </article>;
}
