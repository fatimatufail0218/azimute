"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


/*
 * IMAGES + TEXT: change file names, buttons or lines here.
 * Files go in public/ (for example public/couple1.webp -> "/couple1.webp").
 * pos = which part of the photo stays visible on narrow screens (x% y%).
 */
const slides = [
  {
    src: "/couple1.webp",
    label: "O olhar",
    line: "Um novo olhar para o que importa.",
    alt: "Close-up de uma mulher com olhar sereno, pele iluminada e um reflexo de luz dourada no rosto.",
    pos: "74% 40%",
  },
  {
    src: "/couple2.webp",
    label: "O tempo",
    line: "Tempo para estar inteiro.",
    alt: "Retrato em close de um homem com expressão tranquila, junto à luz quente de uma janela.",
    pos: "68% 35%",
  },
  {
    src: "/couple3.webp",
    label: "O encontro",
    line: "A vida acontece no encontro.",
    alt: "Close-up de um casal sorrindo com os rostos próximos, em um momento de afeto à luz do fim da tarde.",
    pos: "62% 35%",
  },
];

/*
 * TIMING (timeline units)
 * HOLD:     scroll spent looking at one portrait
 * FADE:     scroll spent on the change between two portraits
 * PER_UNIT: screen heights of scroll per unit. Bigger = slower.
 */
const HOLD = 1;
const FADE = 0.5;
const PER_UNIT = 0.7;

const N = slides.length;
const STEP = HOLD + FADE;
const TOTAL = N * HOLD + (N - 1) * FADE;
const startOf = (i: number) => HOLD + (i - 1) * STEP; // when portrait i starts fading in
const centerOf = (i: number) => i * STEP + HOLD / 2; // middle of portrait i's hold
const indexAt = (t: number) => {
  let idx = 0;
  for (let i = 1; i < N; i++) if (t >= startOf(i) + FADE / 2) idx = i;
  return idx;
};

const pad = (v: number) => String(v).padStart(2, "0");

export default function EssenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const bar = barRef.current;
    if (!section || !stage || !bar) return;

    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(section);
    const mm = gsap.matchMedia();

    // Reduced motion: this block is skipped, buttons switch directly
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const photos = q(".es-photo") as HTMLElement[];
      const inners = q(".es-inner") as HTMLElement[];
      const leads = q(".es-lead") as HTMLElement[];

      // first portrait and first line are visible from the start
      gsap.set(photos[0], { opacity: 1 });
      gsap.set(leads[0], { opacity: 1 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * PER_UNIT * TOTAL)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(indexAt(self.progress * TOTAL)),
          onRefresh: (self) => setActive(indexAt(self.progress * TOTAL)),
        },
      });

      // slow zoom on the first portrait while it is on screen
      tl.fromTo(inners[0], { scale: 1 }, { scale: 1.05, duration: STEP }, 0);

      for (let i = 1; i < N; i++) {
        const at = startOf(i);

        // new portrait fades in on top and settles slowly
        tl.fromTo(
          photos[i],
          { opacity: 0 },
          { opacity: 1, duration: FADE, ease: "power1.inOut" },
          at
        );
        tl.fromTo(inners[i], { scale: 1.08 }, { scale: 1, duration: STEP }, at);

        // text: old line leaves, new line arrives
        tl.fromTo(
          leads[i - 1],
          { opacity: 1, y: 0 },
          { opacity: 0, y: -12, duration: FADE * 0.5, immediateRender: false },
          at
        );
        tl.fromTo(
          leads[i],
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: FADE * 0.6 },
          at + FADE * 0.4
        );
      }

      // gold progress line along the bottom of the frame
      tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: TOTAL }, 0);

      triggerRef.current = tl.scrollTrigger ?? null;
      return () => {
        triggerRef.current = null;
      };
    });

    // Removes timeline, pin and ScrollTrigger (React Strict Mode safe)
    return () => mm.revert();
  }, []);

  // Buttons: scroll to the position of that portrait
  const go = (target: number) => {
    const i = Math.max(0, Math.min(N - 1, target));
    const st = triggerRef.current;
    if (!st) {
      setActive(i); // reduced motion: switch directly
      return;
    }
    const y = st.start + (st.end - st.start) * (centerOf(i) / TOTAL);
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const current = slides[active];

  return (
    <section
      ref={sectionRef}
      className="es"
      id="essencia"
      data-header-theme="dark"
      aria-labelledby="es-title"
    >
      <div ref={stageRef} className="es-stage">
        <div className="es-frame">
          <div className="es-photos">
            {slides.map((slide, i) => (
              <figure
                key={slide.src}
                className={`es-photo${i === active ? " is-active" : ""}`}
                style={{ zIndex: i + 1 }}
                aria-hidden={i !== active}
              >
                <div className="es-inner">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 700px) 100vw, 80vw"
                    quality={85}
                    loading="eager"
                    style={{ objectPosition: slide.pos }}
                  />
                </div>
              </figure>
            ))}
          </div>

          <div className="es-shade" />

          <div className="es-copy">
            <p className="es-eyebrow">Essência Azimute</p>
            <h2 id="es-title" className="es-title">
              É sobre
              <br />
              <em>sentir.</em>
            </h2>
            <div className="es-leads">
              {slides.map((slide, i) => (
                <p
                  key={slide.src}
                  className={`es-lead${i === active ? " is-active" : ""}`}
                  aria-hidden={i !== active}
                >
                  {slide.line}
                </p>
              ))}
            </div>
            <span className="es-sign">A VIDA, DE PERTO.</span>
          </div>

          <div
            className="es-switch"
            role="group"
            aria-label="Retratos da essência Azimute"
          >
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                aria-pressed={i === active}
                onClick={() => go(i)}
              >
                <span aria-hidden="true">{pad(i + 1)}</span>
                {slide.label}
              </button>
            ))}
          </div>

          <div className="es-progress" aria-hidden="true">
            <div ref={barRef} className="es-progress-bar" />
          </div>
        </div>

        <p className="sr-only" role="status">
          {current.label}. {current.line}
        </p>
      </div>
    </section>
  );
}