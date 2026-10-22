"use client";
import Link from "next/link";
import Image from "next/image";
import { Field } from "./Field";
import { PathwaySwitch, useDemo } from "./LabShell";
import { pathways } from "./demo";

export function Landing() {
  const { pathway } = useDemo();
  return (
    <>
      <section className="lab-hero">
        <div className="lab-hero-copy">
          <p className="lab-kicker">
            <span className="lab-status-dot" /> WELCOME TO THE LAB
          </p>
          <h1>
            A sharper mind.
            <br />A stronger <em>game.</em>
          </h1>
          <p className="lab-lede">
            The next rep starts before you touch a football. Explore a smarter
            way to learn, reflect and prepare with Coach Tae.
          </p>
          <div className="lab-actions">
            <Link className="lab-button primary" href="/qb-lab/athlete">
              Enter the athlete studio <span>→</span>
            </Link>
            <Link className="lab-button" href="/qb-lab/iq">
              Try a field study →
            </Link>
          </div>
          <div className="lab-hero-tags">
            <span>TACKLE + FLAG</span>
            <span>AGES 8 THROUGH COLLEGE</span>
            <span>ONE REP AT A TIME</span>
          </div>
        </div>
        <div className="lab-hero-visual">
          <Image
            src="/Tae_Training.jpeg"
            alt="Coach Tae during quarterback training"
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            preload
            className="lab-hero-photo"
          />
          <div className="lab-photo-shade" />
          <span className="lab-visual-tag">THE WORK BEHIND THE GAME</span>
          <div className="lab-visual-copy">
            <span>COACH TAE / QB LAB</span>
            <p>
              See more.
              <br />
              Understand more.
              <br />
              <strong>Bring it to the field.</strong>
            </p>
            <span className="lab-outline-arrow" aria-hidden="true">
              →
            </span>
          </div>
        </div>
      </section>
      <section className="lab-section">
        <div className="lab-section-heading">
          <div>
            <p className="lab-kicker">CHOOSE YOUR ENVIRONMENT</p>
            <h2>
              Different games.
              <br />
              The same attention to detail.
            </h2>
          </div>
          <PathwaySwitch />
        </div>
        <div className="lab-pathway-panel">
          <div>
            <span className="lab-chip">{pathways[pathway].format}</span>
            <h3>{pathways[pathway].title}</h3>
            <p className="lab-pathway-focus">{pathways[pathway].focus}</p>
            <p className="lab-muted">{pathways[pathway].note}</p>
            <Link className="lab-text-link" href="/qb-lab/athlete">
              Explore this pathway →
            </Link>
          </div>
          <Field pathway={pathway} />
        </div>
      </section>
      <section className="lab-section">
        <div className="lab-section-heading">
          <div>
            <p className="lab-kicker">A BETTER WAY TO PREPARE</p>
            <h2>Make every rep more intentional.</h2>
          </div>
          <span className="lab-muted">Explore the interactive preview</span>
        </div>
        <div className="lab-feature-grid">
          {[
            [
              "01",
              "Read the field.",
              "Observe the alignment. Question your first read. Watch the picture change.",
              "/qb-lab/iq",
              "FIELD STUDY",
            ],
            [
              "02",
              "See the details.",
              "Explore illustrated film, timestamped feedback and a purposeful comparison view.",
              "/qb-lab/film",
              "FILM ROOM",
            ],
            [
              "03",
              "Grow together.",
              "A family view designed around younger athletes, guidance and clear boundaries.",
              "/qb-lab/family",
              "FAMILY HUB",
            ],
          ].map(([n, title, text, href, label]) => (
            <Link className="lab-feature-card" href={href} key={n}>
              <span className="lab-card-number">{n}</span>
              <div className="lab-mini-icon" aria-hidden="true">
                {n === "01" ? "⌘" : n === "02" ? "▷" : "◎"}
              </div>
              <p className="lab-kicker">{label}</p>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="lab-card-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
      <aside className="lab-coach-strip">
        <Image src="/CTLOGO.jpeg" alt="" width={62} height={62} />
        <div>
          <p className="lab-kicker">TAKE THE LEARNING TO THE FIELD</p>
          <h2>Real coaching. Real conversations.</h2>
          <p>Keep your on-field development connected to Coach Tae.</p>
        </div>
        <a
          className="lab-button primary"
          href="https://calendly.com/taenextlevelqbs/individual-training-clone"
          target="_blank"
          rel="noopener noreferrer"
        >
          Book private training →
          <span className="lab-sr"> (opens in a new tab)</span>
        </a>
      </aside>
    </>
  );
}
