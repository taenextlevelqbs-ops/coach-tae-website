"use client";

import { useEffect, useState } from "react";

export default function Intro() {
  const [showIntro, setShowIntro] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem("coachTaeIntroPlayed");

    if (alreadyPlayed) {
      return;
    }

    setShowIntro(true);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2200);

    const removeTimer = setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem("coachTaeIntroPlayed", "true");
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!showIntro) {
    return null;
  }

  return (
    <div
      className={`simple-intro ${
        fadeOut ? "simple-intro-fade" : ""
      }`}
    >
      <div
        className="simple-intro-image"
        style={{
          backgroundImage: "url('/Tae_Sideline.jpeg')",
        }}
      />

      <div className="simple-intro-overlay" />

      <div className="simple-intro-content">
        <p className="simple-intro-kicker">
          QUARTERBACK DEVELOPMENT
        </p>

        <h1 className="simple-intro-title">
          COACH TAE
        </h1>

        <p className="simple-intro-tagline">
          TRAIN • DEVELOP • COMPETE
        </p>
      </div>
    </div>
  );
}