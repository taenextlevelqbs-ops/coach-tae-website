import Link from "next/link";
import { AppIcon, type AppIconName } from "../AppIcon";
const features: { title: string; text: string; icon: AppIconName }[] = [
  { title: "QB Workouts", text: "Clear, written drills for your feet, balance and throwing fundamentals.", icon: "workout" },
  { title: "Recovery", text: "Gentle movement and recovery education, with clear safety guidance.", icon: "recovery" },
  { title: "QB Simulator", text: "See the defense, practice a decision and learn from the next rep.", icon: "simulator" },
  { title: "Film Feedback", text: "A preview of private coaching conversations about your reps.", icon: "film" },
];
export function Introduction() {
  return <div className="public-introduction">
    <section className="public-intro-copy"><p className="public-eyebrow">YOUR QUARTERBACK DEVELOPMENT SPACE</p><h1>Train Smarter. Play Faster.</h1><p>Coach Tae QB LAB brings workouts, football learning and coaching together in one simple training space. For tackle and flag quarterbacks, ages 8 through college.</p>
      <div className="public-actions"><Link className="train-button" href="/qb-lab/create-account">Get Started<AppIcon name="arrow" /></Link><Link className="public-sample-action" href="/qb-lab/sample">Explore a Sample Drill<AppIcon name="arrow" /></Link></div>
      <p className="public-availability">Account creation is not open yet. Explore the read-only sample; no sign-in is needed.</p>
    </section>
    <section className="public-feature-grid" aria-label="Inside QB LAB">{features.map(feature => <article key={feature.title}><AppIcon name={feature.icon} /><h2>{feature.title}</h2><p>{feature.text}</p></article>)}</section>
    <section className="public-personalization" aria-labelledby="personal-training"><h2 id="personal-training">Personal training. One clear next step.</h2><p>When accounts are available, your pathway and experience will guide a coach-reviewed plan. Your dashboard will put the next activity, your own history and Coach Tae’s feedback together.</p><p>Parents and guardians will manage younger athletes through a verified registration and consent process before youth accounts or private film are enabled.</p></section>
  </div>;
}
