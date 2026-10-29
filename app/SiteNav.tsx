"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const baseLinks = [
  { href: "#training", label: "Training" },
  { href: "#about", label: "About Coach Tae" },
  { href: "#attack", label: "DMV Attack" },
  { href: "#foundation", label: "Foundation" },
  { href: "#apparel", label: "Apparel" },
];

const privateUrl =
  "https://calendly.com/taenextlevelqbs/individual-training-clone";
const groupUrl = "https://calendly.com/taenextlevelqbs/group-training";
const shopUrl = "https://dmvattack.myshopify.com/";

export default function SiteNav() {
  const links = [
    { href: "/portal", label: "Family portal" },
    { href: "/lab", label: "QB Lab" },
    ...baseLinks,
  ];
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <nav aria-label="Primary navigation" className="site-nav">
          <div className="site-nav-inner">
            <a className="site-brand" href="#main-content" onClick={closeMenu}>
              <Image src="/CTLOGO.jpeg" alt="" width={42} height={42} />
              <span>
                <strong>COACH TAE</strong>
                <small>QB DEVELOPMENT · DMV</small>
              </span>
            </a>

            <div className="desktop-nav-links">
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
              <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                Shop <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>

            <a className="nav-booking-link" href={privateUrl}>
              Book a session <span aria-hidden="true">→</span>
            </a>

            <button
              ref={menuButtonRef}
              className="menu-toggle"
              type="button"
              aria-label={
                isOpen ? "Close site navigation" : "Open site navigation"
              }
              aria-expanded={isOpen}
              aria-controls="mobile-site-navigation"
              onClick={() => setIsOpen((open) => !open)}
            >
              <span
                aria-hidden="true"
                className={isOpen ? "menu-icon is-open" : "menu-icon"}
              >
                <span />
                <span />
              </span>
            </button>
          </div>

          <div
            id="mobile-site-navigation"
            className="mobile-nav-panel"
            hidden={!isOpen}
          >
            <p className="mobile-nav-kicker">Explore Coach Tae</p>
            {links.map((link, index) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                <span className="mobile-nav-number" aria-hidden="true">
                  0{index + 1}
                </span>
                {link.label}
                <span className="mobile-nav-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              <span className="mobile-nav-number" aria-hidden="true">
                06
              </span>
              Shop DMV Attack
              <span className="mobile-nav-arrow" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </nav>
      </header>

      <nav className="mobile-booking-bar" aria-label="Quick training booking">
        <a href={privateUrl}>
          <span>PRIVATE</span>
          <strong>Book 1-on-1</strong>
        </a>
        <a href={groupUrl}>
          <span>SMALL GROUP</span>
          <strong>Book a group</strong>
        </a>
      </nav>
    </>
  );
}
