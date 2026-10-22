"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Field } from "./Field";
import { PathwaySwitch, useDemo } from "./LabShell";
import { pathways } from "./demo";

export function Landing() {
  const { pathway } = useDemo();
  const [moment, setMoment] = useState(0);
  return (
    <>
      <section className="lab-cover">
        <div className="lab-cover-copy">
          <p className="lab-kicker">COACH TAE QB LAB / FIELD NOTES, VOL. 01</p>
          <h1>
            THE GAME
            <br />
            BEFORE
            <br />
            <em>THE THROW.</em>
          </h1>
          <p className="lab-lede">
            A working space for quarterbacks who want to see more. Read the
            field, study the details and take a better question to your next
            rep.
          </p>
          <Link className="lab-button primary" href="/qb-lab/athlete">
            Start your first session <span aria-hidden="true">→</span>
          </Link>
          <p className="lab-cover-caption">
            TACKLE + FLAG <span>/</span> AGES 8 THROUGH COLLEGE
          </p>
        </div>
        <div className="lab-cover-board">
          <div className="lab-board-top">
            <span>FIELD STUDY 001</span>
            <span>LIVE DIAGRAM / DEMO</span>
          </div>
          <Field
            pathway={pathway}
            progress={moment}
            routes={false}
            annotate={moment > 45}
          />
          <div className="lab-board-caption">
            <strong>
              {moment < 40
                ? "01 / Start with the shell."
                : "02 / Watch the picture change."}
            </strong>
            <p>A starting alignment is a clue. It is never the whole answer.</p>
          </div>
          <label className="lab-slider-label">
            Scrub the observation <span>{moment}%</span>
            <input
              aria-label="Cover illustration timeline"
              type="range"
              min="0"
              max="100"
              value={moment}
              onChange={(e) => setMoment(Number(e.target.value))}
            />
          </label>
          <Link href="/qb-lab/iq" className="lab-text-link">
            Explore this field study →
          </Link>
        </div>
      </section>
      <section className="lab-process" aria-label="How QB LAB works">
        {[
          ["01", "SEE THE PICTURE", "Read what is there."],
          ["02", "STUDY THE MOMENT", "Slow down the details."],
          ["03", "TAKE THE NEXT REP", "Bring a question to your coach."],
        ].map(([n, title, text]) => (
          <div key={n}>
            <span>{n}</span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </section>
      <section className="lab-section lab-pathway-section">
        <div className="lab-section-heading">
          <div>
            <p className="lab-kicker">
              TWO PATHWAYS / ONE STANDARD OF ATTENTION
            </p>
            <h2>Your game has its own context.</h2>
          </div>
          <PathwaySwitch />
        </div>
        <div className="lab-pathway-editorial">
          <span className="lab-big-index" aria-hidden="true">
            {pathway === "tackle" ? "11" : "05"}
          </span>
          <div>
            <p className="lab-kicker">{pathways[pathway].format}</p>
            <h3>{pathways[pathway].title}</h3>
            <p className="lab-pathway-focus">{pathways[pathway].focus}</p>
            <p className="lab-muted">{pathways[pathway].note}</p>
            <Link className="lab-text-link" href="/qb-lab/athlete">
              Set your learning context →
            </Link>
          </div>
        </div>
      </section>
      <section className="lab-section lab-directory">
        <div className="lab-section-heading">
          <div>
            <p className="lab-kicker">INSIDE THE NOTEBOOK</p>
            <h2>One place. Different ways to learn.</h2>
          </div>
        </div>
        {[
          [
            "01",
            "Football IQ",
            "An interactive classroom. Observe the alignment, follow the change and explain your read.",
            "/qb-lab/iq",
            "OBSERVE",
          ],
          [
            "02",
            "The Film Room",
            "An illustrated review console. Scrub, tag a moment and connect it to a coaching note.",
            "/qb-lab/film",
            "REVIEW",
          ],
          [
            "03",
            "The Family Hub",
            "A quieter view for guardians. Understand the next step and the boundaries around it.",
            "/qb-lab/family",
            "SUPPORT",
          ],
        ].map(([n, title, description, href, label]) => (
          <Link className="lab-directory-row" key={n} href={href}>
            <span className="lab-kicker">
              {n} / {label}
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
      <aside className="lab-coach-strip">
        <Image
          src="/Tae_Training.jpeg"
          width={180}
          height={180}
          alt="Coach Tae during quarterback training"
        />
        <div>
          <p className="lab-kicker">THE NOTEBOOK IS ONLY THE BEGINNING</p>
          <h2>Take it to the field.</h2>
          <p>Keep real coaching at the center of your development.</p>
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
