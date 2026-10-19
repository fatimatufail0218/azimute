"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { gallery, type Category } from "@/data/gallery";
import { useImageViewer } from "./ImageViewer";

type FilterKey = "all" | Category;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas as imagens" },
  { key: "interiors", label: "Interiores" },
  { key: "outdoors", label: "Ao ar livre" },
  { key: "living", label: "Convivência" },
  { key: "plans", label: "Vistas superiores" },
];

/* Time each image stays on screen after pressing play (ms) */
const PLAY_MS = 6500;

const plans = gallery.filter((item) => item.category === "plans");
const pad = (v: number) => String(v).padStart(2, "0");

export default function Spaces() {
  const { open } = useImageViewer();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const list = useMemo(
    () =>
      filter === "all"
        ? gallery
        : gallery.filter((item) => item.category === filter),
    [filter]
  );
  const n = list.length;
  const current = list[index] ?? list[0];

  const go = (target: number) => setIndex(((target % n) + n) % n);

  const choose = (key: FilterKey) => {
    setFilter(key);
    setIndex(0);
    setPlaying(false);
  };

  // Play: moves to the next image after PLAY_MS, only after the user presses play
  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % n), PLAY_MS);
    return () => window.clearTimeout(id);
  }, [playing, index, n]);

  // Only the current image and its two neighbours are mounted (keeps it light)
  const near = new Set([index, (index + 1) % n, (index - 1 + n) % n]);

  return (
    <section
      className="ss"
      id="espacos"
      data-header-theme="light"
      aria-labelledby="ss-title"
    >
      <div className="ss-head">
        <div>
          <p className="ss-eyebrow">04 / Explore cada detalhe</p>
          <h2 id="ss-title" className="ss-title">
            Imagine <em>viver aqui.</em>
          </h2>
        </div>
        <span className="ss-aside">
          {gallery.length} cenas para explorar.
          <br />
          Veja cada imagem por inteiro.
        </span>
      </div>

      {/* Two floor-plan cards */}
      <div className="ss-plans">
        {plans.map((plan, i) => (
          <button
            key={plan.src}
            type="button"
            className="ss-card"
            aria-label={`Ampliar ${plan.title}`}
            onClick={() => open(plan)}
          >
            <span className="ss-card-label">VISTA SUPERIOR / {pad(i + 1)}</span>
            <span className="ss-card-img">
              <Image
                src={plan.src}
                alt={plan.alt}
                fill
                sizes="(max-width: 700px) 90vw, 40vw"
                quality={80}
                style={{ objectFit: "contain" }}
              />
            </span>
            <span className="ss-card-foot">
              <em>{plan.title}</em>
              <span aria-hidden="true">↗</span>
            </span>
          </button>
        ))}
      </div>
      <p className="ss-note">
        Vistas ilustrativas dos ambientes, sem correspondência indicada com as
        metragens dos apartamentos.
      </p>

      {/* Gallery slider */}
      <div
        className="ss-gallery"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Perspectivas do Azimute"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            go(index + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(index - 1);
          }
        }}
      >
        <div className="ss-filters-wrap">
          <div className="ss-filters" role="group" aria-label="Categorias de imagens">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={filter === item.key}
                onClick={() => choose(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ss-bar">
          <div className="ss-title-row" aria-live="polite" aria-atomic="true">
            <span className="ss-count">
              {pad(index + 1)} / {pad(n)}
            </span>
            <h3>{current.title}</h3>
          </div>
          <div className="ss-controls">
            <button
              type="button"
              className="ss-play"
              aria-label={playing ? "Pausar sequência" : "Reproduzir sequência de imagens"}
              aria-pressed={playing}
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? "Ⅱ" : "▷"}
            </button>
            <button type="button" aria-label="Imagem anterior" onClick={() => go(index - 1)}>
              ←
            </button>
            <button type="button" aria-label="Próxima imagem" onClick={() => go(index + 1)}>
              →
            </button>
          </div>
        </div>

        <div className="ss-stage">
          {list.map((item, i) =>
            near.has(i) ? (
              <figure
                key={item.src}
                className={`ss-panel${i === index ? " is-current" : ""}${
                  item.category === "plans" ? " is-plan" : ""
                }`}
                aria-hidden={i !== index}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="100vw"
                  quality={80}
                  style={{
                    objectFit: item.category === "plans" ? "contain" : "cover",
                    objectPosition: item.pos,
                  }}
                />
              </figure>
            ) : null
          )}

          <button
            type="button"
            className="ss-open"
            onClick={() => open(current)}
          >
            Ver imagem completa <span aria-hidden="true">↗</span>
          </button>
          <span className="ss-tag">Perspectiva artística</span>

          {playing && (
            <span
              key={index}
              className="ss-progress"
              style={{ animationDuration: `${PLAY_MS}ms` }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </section>
  );
}