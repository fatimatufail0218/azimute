"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * TIMING, in seconds from the start. Change a number to move that step earlier or later.
 *   flare     = the light line starts sweeping
 *   orbit     = the circle (arc) draws
 *   stroke    = the A outline draws
 *   fill      = the A fills with crystal
 *   arrow     = the arrow settles in
 *   wordmark  = AZIMUTE reveals
 *   caption   = last line fades in
 *   lift      = the shutter starts to rise
 * LIFT = how long the shutter takes to go up.
 */
const T = {
  flare: 0.6,
  orbit: 0.6,
  stroke: 1.2,
  fill: 1.9,
  arrow: 2.3,
  wordmark: 2.7,
  caption: 3.3,
  lift: 4.5,
};
const LIFT = 1.1;

export default function IntroScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    const html = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let finished = false;
    let lifted = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      html.style.overflow = "";
      delete html.dataset.intro;
      setDone(true);
      // The page was measured while the scroll was locked, so measure it once more
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    // Tells the hero that the shutter is rising, so its text can rise with it
    const announce = () => {
      if (lifted) return;
      lifted = true;
      window.dispatchEvent(new Event("azimute:intro-lift"));
    };

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    html.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });

    const ctx = gsap.context(() => {
      // Reduced motion: no drawing, no shutter. A short fade only.
      if (reduce) {
        gsap.to(root, { autoAlpha: 0, duration: 0.4, onComplete: finish });
        return;
      }

      html.dataset.intro = "playing";
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tlRef.current = tl;

      // Crystal background rises out of the dark
      tl.fromTo(".intro-bg", { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.8, ease: "power1.out" }, 0);
      tl.fromTo(".intro-eyebrow", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9 }, 0.3);
      tl.fromTo(".intro-skip", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.6);

    // Flare: slow sweep from top-left to bottom-right
tl.fromTo(
  ".intro-flare",
  { x: -vw * 0.75, y: -vh * 0.08 },
  {
    x: vw * 1.1,
    y: vh * 0.1,
    duration: 4,
    ease: "power1.inOut",
  },
  T.flare
);

tl.fromTo(
  ".intro-flare",
  { opacity: 0 },
  { opacity: 1, duration: 0.8, ease: "none" },
  T.flare
);

tl.to(
  ".intro-flare",
  { opacity: 0, duration: 1, ease: "none" },
  T.flare + 3
);
      // Symbol, one part after another
      tl.fromTo(".is-orbit", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, T.orbit);
      tl.fromTo(".is-stroke", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, T.stroke);
      tl.to(".is-material", { opacity: 1, duration: 0.7, ease: "power1.inOut" }, T.fill);
      tl.fromTo(
        ".is-bearing",
        { opacity: 0, scale: 0.2, rotation: -35, svgOrigin: "58 74" },
        { opacity: 1, scale: 1, rotation: 0, svgOrigin: "58 74", duration: 0.8, ease: "back.out(1.7)" },
        T.arrow
      );

      // Wordmark reveals from the left, then the caption
      tl.fromTo(
        ".intro-wordmark",
        { clipPath: "inset(0 100% 0 0)", opacity: 0 },
        { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 1.1, ease: "power2.inOut" },
        T.wordmark
      );
      tl.fromTo(".intro-caption", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7 }, T.caption);

      // Shutter: the whole screen rises from the bottom to the top
      tl.addLabel("lift", T.lift);
      tl.to(
        root,
        { yPercent: -100, duration: LIFT, ease: "power4.inOut", onStart: announce, onComplete: finish },
        "lift"
      );
    }, root);

    // Cleanup (also runs in React Strict Mode): removes every tween and unlocks the scroll
    return () => {
      ctx.revert();
      tlRef.current = null;
      html.style.overflow = "";
      delete html.dataset.intro;
    };
  }, []);

  // Skip: jump straight to the moment where the shutter starts to rise
  const skip = () => {
    const tl = tlRef.current;
    if (tl && tl.time() < tl.labels.lift) tl.seek("lift", false);
  };

  if (done) return null;

  return (
    <div ref={rootRef} className="intro">
      <div className="intro-scene" aria-hidden="true">
        <div className="intro-bg">
          <Image
            src="/crystal-bg.webp"
            alt=""
            fill
            sizes="100vw"
            quality={75}
            preload
          />
        </div>
        <div className="intro-shade" />
        <div className="intro-flare" />

        <div className="intro-identity">
          <span className="intro-eyebrow">ASL APRESENTA</span>

          <svg className="intro-symbol" viewBox="0 0 120 140" fill="none">
            <defs>
              <linearGradient
                id="intro-crystal"
                x1="15"
                y1="115"
                x2="105"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#5e746f" />
                <stop offset=".24" stopColor="#b9b5a3" />
                <stop offset=".39" stopColor="#fff8e7" />
                <stop offset=".42" stopColor="#d7c1a0" />
                <stop offset=".48" stopColor="#445c5d" />
                <stop offset=".73" stopColor="#ac8e6d" />
                <stop offset=".84" stopColor="#f6eee0" />
                <stop offset="1" stopColor="#b8cac6" />
              </linearGradient>
            </defs>
            <path
              className="is-material"
              d="M15 115 60 17 105 115H92L60 42 28 115Z"
              fill="url(#intro-crystal)"
            />
            <path
              className="is-stroke"
              d="M15 115 60 17 105 115M23 116H97"
              stroke="#E1CCB0"
              strokeWidth="1.2"
              pathLength={1}
            />
            <path
              className="is-bearing"
              d="M44 78 73 56 68 91 61 76Z"
              fill="#EAD9BD"
            />
            <path
              className="is-orbit"
              d="M35 124a50 50 0 0 0 50-87"
              stroke="#E1CCB0"
              strokeWidth=".7"
              pathLength={1}
            />
          </svg>

          <Image
            className="intro-wordmark"
            src="/azimute-wordmark.svg"
            alt=""
            width={540}
            height={90}
            loading="eager"
            unoptimized
          />
          <span className="intro-caption">UMA NOVA DIREÇÃO PARA MORAR</span>
        </div>
      </div>

      <button ref={skipRef} type="button" className="intro-skip" onClick={skip}>
        Pular abertura <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}