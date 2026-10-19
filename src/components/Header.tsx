"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrandLogo from "./BrandLogo";

const links = [
  { href: "#projeto", label: "O projeto" },
  { href: "#perspectiva", label: "Perspectiva" },
  { href: "#essencia", label: "Essência" },
  { href: "#residencias", label: "Residências" },
  { href: "#espacos", label: "Espaços" },
  { href: "#contato", label: "Contato" },
];

type Theme = "photo" | "dark" | "light";

// The header looks at the section sitting under this vertical point (in px)
const PROBE_Y = 40;

export default function Header() {
  const [theme, setTheme] = useState<Theme>("photo");
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // 1. Pick the header style from the section currently under the header
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      let next: Theme = window.scrollY < 8 ? "photo" : "light";
      document
        .querySelectorAll<HTMLElement>("[data-header-theme]")
        .forEach((section) => {
          const box = section.getBoundingClientRect();
          if (box.top <= PROBE_Y && box.bottom > PROBE_Y) {
            next = section.dataset.headerTheme as Theme;
          }
        });
      setTheme(next);
    };

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  // 2. Mobile menu open/close
  const closeMenu = useCallback(() => {
    document.documentElement.style.overflow = "";
    setOpen(false);
  }, []);

  const toggleMenu = () => {
    if (open) {
      closeMenu();
    } else {
      document.documentElement.style.overflow = "hidden";
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1025px)");
    const onChange = () => {
      if (desktop.matches) closeMenu();
    };

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onChange);
      document.documentElement.style.overflow = "";
    };
  }, [open, closeMenu]);

  // While the menu is open over the photo, use the solid dark style
  const effectiveTheme: Theme = open && theme === "photo" ? "dark" : theme;

  return (
    <header className="header" data-theme={effectiveTheme} data-open={open}>
      <a className="wordmark" href="#inicio" aria-label="Azimute, início">
        <BrandLogo />
      </a>

      <nav className="nav" aria-label="Principal">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="header-right">
        <span className="asl">
          ASL
          <small>
            INCORPORADORA
            <br />E CONSTRUTORA
          </small>
        </span>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={toggleMenu}
        >
          <span />
          <span />
        </button>
      </div>

      <nav
        className="mobile-menu"
        id="mobile-menu"
        aria-label="Menu móvel"
        hidden={!open}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}
        <p>ASL Incorporadora e Construtora</p>
      </nav>
    </header>
  );
}