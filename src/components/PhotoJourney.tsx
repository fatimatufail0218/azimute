"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useImageViewer } from "./ImageViewer";


export type JourneySlide = {
  src: string;
  title: string;
  alt: string;
  pos: string; // which part of the photo stays visible when cropped
};

type Props = {
  id: string;
  label: string;
  nextHref: string; // where "Próximo capítulo" scrolls to
  slides: JourneySlide[];
  theme?: "light" | "dark";
};

/*
 * TIMING (timeline units)
 * H0:   scroll spent on image 1 before the first change
 * STEP: scroll from one image to the next (1 unit of it is the wipe itself)
 * TAIL: hold on the last image before the section is released
 * PER_UNIT: screen heights of scroll per unit. Bigger = slower.
 */
const H0 = 0.6;
const STEP = 1.6;
const TAIL = 0.6;
const PER_UNIT = 0.44;

function timing(n: number) {
  const total = H0 + (n - 1) * STEP + TAIL;
  const startOf = (i: number) => H0 + (i - 1) * STEP;
  const settledAt = (i: number) =>
    i === 0 ? H0 / 2 : startOf(i) + 1 + (STEP - 1) / 2;
  const indexAt = (t: number) => {
    let idx = 0;
    for (let i = 1; i < n; i++) if (t >= startOf(i) + 0.5) idx = i;
    return idx;
  };
  return { total, startOf, settledAt, indexAt };
}

const pad = (v: number) => String(v).padStart(2, "0");

export default function PhotoJourney({
  id,
  label,
  nextHref,
  slides,
  theme = "light",
}: Props) {
  const n = slides.length;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const { open } = useImageViewer();

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const { total, startOf, indexAt } = timing(slides.length);
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(section);
    const mm = gsap.matchMedia();

    // Reduced motion: this block is skipped, buttons switch images directly
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const panels = q(".jr-panel") as HTMLElement[];
      const photos = q(".jr-inner") as HTMLElement[];

      gsap.set(panels[0], { opacity: 1 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * PER_UNIT * total)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(indexAt(self.progress * total)),
          onRefresh: (self) => setActive(indexAt(self.progress * total)),
        },
      });

      for (let i = 1; i < slides.length; i++) {
        // new image wipes in from the left, on top of the previous one
        tl.fromTo(
          panels[i],
          { clipPath: "inset(0 100% 0 0)", opacity: 0.2 },
          { clipPath: "inset(0 0% 0 0)", opacity: 1, duration: 1, ease: "power2.inOut" },
          startOf(i)
        );
        // the photo inside settles slowly
        tl.fromTo(photos[i], { scale: 1.1 }, { scale: 1, duration: STEP }, startOf(i));
      }

      // hold on the last image before the pin is released
      tl.to({}, { duration: TAIL }, total - TAIL);

      triggerRef.current = tl.scrollTrigger ?? null;
      return () => {
        triggerRef.current = null;
      };
    });

    // Removes timeline, pin and ScrollTrigger (Strict Mode safe)
    return () => mm.revert();
  }, [slides]);

  // Arrow buttons: scroll to the position of that image
  const go = (target: number) => {
    const i = Math.max(0, Math.min(n - 1, target));
    const st = triggerRef.current;
    if (!st) {
      setActive(i); // reduced motion: switch directly
      return;
    }
    const { total, settledAt } = timing(n);
    const y = st.start + (st.end - st.start) * (settledAt(i) / total);
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const current = slides[active];

  return (
    <section
      ref={sectionRef}
      className={`jr${theme === "dark" ? " jr--dark" : ""}`}
      id={id}
      data-header-theme={theme}
      aria-label={label}
    >
      <div ref={stageRef} className="jr-stage">
        <div className="jr-top">
          <span>{label}</span>
          <a href={nextHref}>
            Próximo capítulo <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="jr-frame">
          {slides.map((slide, i) => (
            <figure
              key={slide.src}
              className={`jr-panel${i === active ? " is-active" : ""}`}
              style={{ zIndex: i + 1 }}
              aria-hidden={i !== active}
            >
              <div className="jr-inner">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  quality={80}
                  style={{ objectPosition: slide.pos }}
                />
              </div>
            </figure>
          ))}

          <button
            type="button"
            className="jr-open"
            onClick={() => open(current)}
          >
            Imagem completa <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="jr-bottom">
          <div className="jr-caption">
            <h3 aria-live="off">{current.title}</h3>
            <p className="jr-meta">
              <span>
                {pad(active + 1)} / {pad(n)}
              </span>
              <span>Perspectiva artística</span>
            </p>
            <div className="jr-ticks" aria-hidden="true">
              {slides.map((slide, i) => (
                <i key={slide.src} className={i <= active ? "is-on" : ""} />
              ))}
            </div>
            <p className="jr-hint">Role para descobrir a próxima imagem</p>
          </div>

          <div className="jr-controls">
            <button
              type="button"
              aria-label="Imagem anterior"
              disabled={active === 0}
              onClick={() => go(active - 1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Próxima imagem"
              disabled={active === n - 1}
              onClick={() => go(active + 1)}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}