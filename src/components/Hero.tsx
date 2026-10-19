"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * IMAGES: change the file names only here.
 * When you get a real night photo, set NIGHT_SRC to it (for example "/hero2.webp").
 * The dark tint filter turns itself off when the two files are different.
 * The third image (crystal) is the fixed site background, see SiteBackground.tsx.
 */
const DAY_SRC = "/hero1.webp";
const NIGHT_SRC = "/hero2.webp";
const NIGHT_IS_PLACEHOLDER = NIGHT_SRC === DAY_SRC;

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    // Everything below only runs when reduced motion is NOT requested
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Intro: text rises softly when the page loads
            // Intro: text rises softly. While the loading screen plays, wait until its shutter starts to lift.
      const riseIn = () =>
        gsap.fromTo(
          q(".hero-intro"),
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1.2, ease: "power2.out", stagger: 0.12 }
        );
      const waiting = document.documentElement.dataset.intro === "playing";
      if (waiting) {
        gsap.set(q(".hero-intro"), { autoAlpha: 0 });
        window.addEventListener("azimute:intro-lift", riseIn, { once: true });
      } else {
        riseIn();
      }

      // Scroll timeline: 0 -> 1 follows the scroll through the whole hero
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

            // slow zoom on the photos for the whole hero
      tl.to(q(".hero-frame"), { scale: 1.07, duration: 0.75, ease: "none" }, 0);

      // STAGE 1 (0 - 0.3): headline leaves, evening turns into night
      tl.to(
        q(".hero-content"),
        { y: -70, autoAlpha: 0, duration: 0.18, ease: "none" },
        0.04
      );
      tl.to(
        q(".hero-side, .hero-scroll, .hero-note"),
        { autoAlpha: 0, duration: 0.1, ease: "none" },
        0
      );
      tl.to(
        q(".hero-photo--night"),
        { opacity: 1, duration: 0.26, ease: "power1.inOut" },
        0.06
      );

      // STAGE 2 (0.3 - 0.55): the night photo stays alone on screen, no text.
      // Nothing to animate here: the scroll itself is the pause.

      // STAGE 3 (0.55 - 0.75): night fades out, the fixed crystal appears
      tl.to(
        q(".hero-frame"),
        { opacity: 0, duration: 0.2, ease: "power1.inOut" },
        0.55
      );

      // STAGE 4 (0.72 - 0.9): logo and AZIMUTE appear on the crystal
      tl.fromTo(
        q(".hero-reframe"),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out" },
        0.72
      );

      // hold before the hero is released
      tl.to({}, { duration: 0.1 }, 0.9)      
      return () => window.removeEventListener("azimute:intro-lift", riseIn);
    });

    // Removes the timeline and ScrollTrigger (also fixes React Strict Mode)
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="hero"
      id="inicio"
      data-header-theme="photo"
      aria-labelledby="hero-title"
    >
      <div className="hero-sticky">
        <div className="hero-frame">
          <Image
            className="hero-photo"
            src={DAY_SRC}
            alt="Perspectiva da fachada do Residencial Azimute ao entardecer."
            fill
            sizes="100vw"
            quality={85}
            preload
          />
                    <Image
            className={`hero-photo hero-photo--night${
              NIGHT_IS_PLACEHOLDER ? " hero-photo--tint" : ""
            }`}
            src={NIGHT_SRC}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            quality={85}
            loading="eager"
          />
          <div className="hero-shade" />
        </div>

        <div className="hero-content">
          <p className="hero-location hero-intro">Vila Vitória · Mauá</p>
          <h1 id="hero-title" className="hero-title hero-intro">
            <span>SEU PRÓXIMO</span>
            <em>horizonte.</em>
          </h1>
          <div className="hero-bottom hero-intro">
            <p>
              Uma nova direção para morar.
              <br />
              Um empreendimento ASL.
            </p>
            <a className="hero-cta" href="#projeto">
              <span>Conheça o Azimute</span>
              <span className="hero-cta-arrow" aria-hidden="true">
                ↓
              </span>
            </a>
          </div>
        </div>

        <div className="hero-side" aria-hidden="true">
          ARQUITETURA · LUZ · VIDA
        </div>
        <div className="hero-note">Perspectiva artística</div>
        <div className="hero-scroll" aria-hidden="true">
          <span>EXPLORE</span>
          <div>
            <i />
          </div>
        </div>

        {/* Appears on top of the fixed crystal background */}
        <div className="hero-reframe" aria-hidden="true">
          <small>ASL APRESENTA</small>
            <Image
            className="hero-reframe-mark"
            src="/azimute-symbol.svg"
            alt=""
            width={120}
            height={140}
            unoptimized
          />
          <p>AZIMUTE</p>
          <small>UMA NOVA DIREÇÃO PARA MORAR</small>
        </div>
      </div>
    </section>
  );
}