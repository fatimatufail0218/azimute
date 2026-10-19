"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createFrameKit, FRAME_PX, type MetalFrame } from "@/lib/metalFrame";
import { useImageViewer } from "./ImageViewer";

/*
 * IMAGES: add, remove or rename here. Count, captions and scroll length adjust by themselves.
 * pos = which part of the photo stays visible when it is cropped.
 */
const slides = [
  { src: "/interior1.webp", title: "Ambientes que se conectam", alt: "Sala de estar com sofá claro, madeira, pedra e jardim vertical.", pos: "50% 54%" },
  { src: "/interior2.webp", title: "Espaço para estar junto", alt: "Cozinha, mesa de jantar e estar integrados, com luz natural.", pos: "50% 54%" },
  { src: "/interior3.webp", title: "Tempo para ficar", alt: "Sala com sofá claro, painel de madeira e bar ao fundo.", pos: "50% 57%" },
  { src: "/interior4.webp", title: "Detalhes que aproximam", alt: "Mesa de jantar com pedra escura e sala integrada ao fundo.", pos: "50% 54%" },
  { src: "/interior5.webp", title: "Texturas para o cotidiano", alt: "Estar com sofá claro e cozinha revestida de pedra escura.", pos: "50% 54%" },
  { src: "/interior6.webp", title: "A luz faz parte", alt: "Cozinha e estar em pedra e madeira abertos para um terraço ensolarado.", pos: "50% 55%" },
  { src: "/interior7.webp", title: "Da cozinha ao céu aberto", alt: "Cozinha em tons de chumbo e mesa de jantar conectadas ao terraço.", pos: "50% 54%" },
  { src: "/interior8.webp", title: "Luz entre os ambientes", alt: "Pátio envidraçado entre o quarto e a cozinha, com luz dourada sobre a pedra.", pos: "50% 55%" },
  { src: "/outdoor1.webp", title: "Abra as portas para o dia", alt: "Quarto voltado ao terraço, com paisagismo e deck ao fundo.", pos: "50% 53%" },
  { src: "/outdoor2.webp", title: "Entre dentro e fora", alt: "Mesa de madeira no terraço, jardim e conexão com a sala de jantar.", pos: "50% 53%" },
  { src: "/outdoor3.webp", title: "Espaço para respirar", alt: "Terraço com sofás claros, palmeiras e portas de vidro.", pos: "50% 59%" },
  { src: "/outdoor4.webp", title: "Sob a luz do sol", alt: "Terraço com deck elevado, espreguiçadeiras e jardim ao pôr do sol.", pos: "50% 56%" },
  { src: "/outdoor5.webp", title: "Uma pausa no horizonte", alt: "Piscina curva com deck de madeira e espreguiçadeiras.", pos: "50% 60%" },
  { src: "/living1.webp", title: "Sabores e encontros", alt: "Espaço gourmet externo com bancada de pedra, churrasqueira e forno.", pos: "50% 58%" },
  { src: "/living2.webp", title: "Entre jardins e conversas", alt: "Pátio com mesas, parede verde e acesso ao jardim para pets.", pos: "50% 55%" },
  { src: "/living3.webp", title: "Lugar de encontro", alt: "Mesas sob ombrelones em um pátio com jardim vertical.", pos: "50% 57%" },
  { src: "/living4.webp", title: "Companhia em todos os momentos", alt: "Área ajardinada com circuito de obstáculos para pets.", pos: "50% 56%" },
];

const NEXT_HREF = "#essencia"; // where "Continuar no site" scrolls to

/*
 * SCROLL LENGTH
 * INTRO:    scroll used by the first zoom (title fades out)
 * TAIL:     hold on the last image before the section is released
 * PER_UNIT: screen heights of scroll per image step. Bigger = slower.
 */
const INTRO = 0.9;
const TAIL = 0.5;
const PER_UNIT = 0.5;

/* Camera angle. Smaller = flatter, bigger = stronger perspective. */
const FOV = 38;

/*
 * QUALITY / MEMORY
 * QUALITY     = render scale (0.8 = same as the reference). Lower = lighter.
 * LOW_TEX     = size (px, longest side) of the small texture every photo always keeps.
 * MAX_TEX     = size of the sharp texture, kept only for the photos near the current one.
 * HIGH_RADIUS = how many photos before/after the current one stay sharp (2 -> 5 sharp photos).
 */
const QUALITY = 0.8;
const LOW_TEX = 720;
const MAX_TEX = 1600;
const HIGH_RADIUS = 2;

/* How far (in cards) the "active card" zoom reaches. Smaller = only the middle card grows. */
const FOCUS_RANGE = 1.6;

/*
 * ACTIVE (ZOOMED) CARD, frame included, in px. On a big screen it is exactly this size.
 * The frame (13px front, 40px deep) is set in src/lib/metalFrame.ts.
 * INTRO_SCALE = size of the card at the very start, compared to the zoomed size.
 */
const ACTIVE_W = 1057;
const ACTIVE_H = 608;
const INTRO_SCALE = 0.74;
const PHOTO_ASPECT = (ACTIVE_W - 2 * FRAME_PX.pad) / (ACTIVE_H - 2 * FRAME_PX.pad); // 1031 / 582

/*
 * SPIRAL LOOK
 * maxW          = the zoomed card never gets wider than this share of the screen width
 * reserve       = px kept free for the top labels and the bottom bar
 * R             = helix radius, as a share of half the card width (how far the side cards sit left/right)
 * zk            = depth of the helix. 1 = full depth, smaller = side cards come closer to the active card,
 *                 stick out more in front of it and cut deeper into it (more "merged"). Try 0.5 to 1.
 * cardsPerTurn  = cards in one full turn. 4 = each card is exactly 90 degrees to the next
 * rotY          = how much each card turns with the helix (1 = follows it fully, 0 = all flat)
 * yaw           = extra turn of every card in degrees, shows the frame's thickness (flip the sign for the other side)
 * spacing       = vertical gap between neighbours, in x card height (smaller = tighter stack)
 * cx0 -> cx1    = helix centre at the start -> after the zoom (% of width)
 * cy0 -> cy1    = helix centre at the start -> after the zoom (% of height)
 * centerScale   = how much bigger the active card is than the others (1.2 = 20%)
 * tilt          = roll in degrees for side cards
 * thick         = frame size multiplier (1 = exactly 13px / 40px, mobile uses more so it stays visible)
 */
const GEO = {
  wide: { maxW: 0.65, reserve: 250, R: 0.93, zk: 0.7, cardsPerTurn: 4, rotY: 1, yaw: -9, spacing: 0.56, cx0: 0.595, cx1: 0.55, cy0: 0.51, cy1: 0.47, centerScale: 1.2, tilt: -2.5, thick: 1 },
  narrow: { maxW: 0.9, reserve: 240, R: 1, zk: 0.8, cardsPerTurn: 4, rotY: 1, yaw: -9, spacing: 0.66, cx0: 0.5, cx1: 0.5, cy0: 0.5, cy1: 0.46, centerScale: 1.12, tilt: -2, thick: 2.2 },
};

const N = slides.length;
const TOTAL = INTRO + (N - 1) + TAIL;
const DEG = Math.PI / 180;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const pad2 = (v: number) => String(v).padStart(2, "0");

type Card = {
  frame: MetalFrame;
  low: THREE.CanvasTexture | null; // small texture, always kept
  high: THREE.CanvasTexture | null; // sharp texture, only near the current photo
  map: THREE.CanvasTexture | null; // the one currently shown
  aspect: number;
  px: number;
  py: number;
  lowBusy: boolean;
  highBusy: boolean;
};

export default function PerspectiveSpiral() {
  const stageRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"gl" | "static">("gl");
  const [ready, setReady] = useState(false); // true after the first frame is drawn
  const { open: openViewer } = useImageViewer();

  useEffect(() => {
    const stage = stageRef.current;
    const mount = glRef.current;
    const copy = copyRef.current;
    const bg = bgRef.current;
    const bar = barRef.current;
    if (!stage || !mount || !copy || !bg || !bar) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    // Reduced motion: no WebGL, no pin. CSS shows a simple vertical list.
    mm.add("(prefers-reduced-motion: reduce)", () => {
      setMode("static");
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // ---------- renderer ----------
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        setMode("static"); // WebGL not available
        return;
      }
      setMode("gl");
      renderer.setClearColor(0x000000, 0);

      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.pointerEvents = "auto";
      canvas.style.cursor = "default";
      canvas.dataset.engine = `three.js r${THREE.REVISION}`;
      canvas.dataset.renderQuality = String(QUALITY);
      canvas.dataset.renderActive = "false";
      canvas.dataset.photographs = String(N);
      mount.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 10000);
      const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const bufferSize = new THREE.Vector2();

      // ---------- metal reflections ----------
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const envTarget = pmrem.fromScene(room, 0.04);
      scene.environment = envTarget.texture;
      pmrem.dispose();
      (room as unknown as { dispose?: () => void }).dispose?.();

      const key = new THREE.DirectionalLight(0xfff3df, 1.4);
      key.position.set(-0.6, 0.9, 1);
      scene.add(key);

      // ---------- cards (one metal frame + photo each) ----------
      const kit = createFrameKit();
      const cards: Card[] = slides.map((slide) => {
        const frame = kit.create();
        frame.group.visible = false;
        scene.add(frame.group);
        const [px, py] = slide.pos.split(" ").map((v) => parseFloat(v) / 100);
        return {
          frame,
          low: null, high: null, map: null,
          aspect: 16 / 9, px, py,
          lowBusy: false, highBusy: false,
        };
      });

      // ---------- state & measurements ----------
      const state = { intro: 0, p: 0 };
      let dirty = true;
      let disposed = false;
      let visible = true;
      let lastIndex = -1;
      let currentIndex = 0;

      const m = {
        vw: 1, vh: 1, R: 0, zk: 1, step: 90, turn: 4, spacing: 0, cx0: 0, cx1: 0, cy0: 0, cy1: 0,
        centerScale: 1.2, rotY: 1, yaw: -9, tilt: -2.5, cardW: 1, cardH: 1,
      };

      // cover-crop of the shown texture inside the card (like object-fit: cover)
      const crop = (c: Card) => {
        const tex = c.map;
        if (!tex) return;
        const ca = m.cardW / m.cardH;
        const ia = c.aspect;
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);
        if (ia > ca) {
          const rx = ca / ia;
          tex.repeat.x = rx;
          tex.offset.x = (1 - rx) * c.px;
        } else {
          const ry = ia / ca;
          tex.repeat.y = ry;
          tex.offset.y = (1 - ry) * (1 - c.py);
        }
      };

      // ---------- textures: small for all, sharp only near the current photo ----------
      const toTexture = (img: HTMLImageElement, max: number) => {
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const canvasEl = document.createElement("canvas");
        canvasEl.width = Math.max(1, Math.round(img.naturalWidth * s));
        canvasEl.height = Math.max(1, Math.round(img.naturalHeight * s));
        const ctx = canvasEl.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
        }
        const tex = new THREE.CanvasTexture(canvasEl);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = aniso;
        return tex;
      };

      const show = (c: Card, tex: THREE.CanvasTexture | null) => {
        if (!tex || c.map === tex) return;
        c.map = tex;
        const mat = c.frame.photo.material;
        mat.map = tex;
        mat.color.set(0xffffff);
        mat.needsUpdate = true;
        crop(c);
        dirty = true;
      };

      const stats = () => {
        let low = 0;
        let high = 0;
        let busy = 0;
        cards.forEach((c) => {
          if (c.low) low += 1;
          if (c.high) high += 1;
          if (c.lowBusy || c.highBusy) busy += 1;
        });
        canvas.dataset.residentTextures = String(low + high);
        canvas.dataset.highResolutionTextures = String(high);
        canvas.dataset.inflightTextures = String(busy);
      };

      const fetchImg = (i: number, ok: (img: HTMLImageElement) => void, fail: () => void) => {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => {
          if (!disposed) ok(img);
        };
        img.onerror = fail;
        img.src = slides[i].src;
      };

      const wantHigh = (i: number) => Math.abs(i - currentIndex) <= HIGH_RADIUS;

      // first load: small texture (and the sharp one too, if the photo is near the current one)
      const load = (i: number) => {
        const c = cards[i];
        if (c.low || c.lowBusy) return;
        c.lowBusy = true;
        fetchImg(
          i,
          (img) => {
            c.lowBusy = false;
            c.aspect = img.naturalWidth / img.naturalHeight;
            c.low = toTexture(img, LOW_TEX);
            if (wantHigh(i) && !c.high) c.high = toTexture(img, MAX_TEX);
            show(c, c.high ?? c.low);
            stats();
          },
          () => {
            c.lowBusy = false;
          }
        );
      };

      const upgrade = (i: number) => {
        const c = cards[i];
        if (c.high || c.highBusy || !c.low) return;
        c.highBusy = true;
        fetchImg(
          i,
          (img) => {
            c.highBusy = false;
            if (!wantHigh(i)) return; // user already scrolled away
            c.high = toTexture(img, MAX_TEX);
            show(c, c.high);
            stats();
          },
          () => {
            c.highBusy = false;
          }
        );
      };

      const downgrade = (i: number) => {
        const c = cards[i];
        if (!c.high) return;
        if (c.low) show(c, c.low);
        c.high.dispose();
        c.high = null;
      };

      const balance = () => {
        cards.forEach((_, i) => {
          // neighbours are always on screen, so they must never stay empty
          if (Math.abs(i - currentIndex) <= 3) load(i);
          if (wantHigh(i)) upgrade(i);
          else downgrade(i);
        });
        stats();
      };

      // ---------- layout ----------
      const layout = () => {
        const vw = stage.clientWidth;
        const vh = stage.clientHeight;
        if (!vw || !vh) return;
        const wide = vw > 700;
        const g = wide ? GEO.wide : GEO.narrow;

        renderer.setPixelRatio(
          Math.max(1, Math.min(window.devicePixelRatio || 1, 2) * QUALITY)
        );
        renderer.setSize(vw, vh, false);
        renderer.getDrawingBufferSize(bufferSize);
        canvas.dataset.drawingBufferPixels = String(
          Math.round(bufferSize.x * bufferSize.y)
        );

        // 1 world unit = 1 pixel at z = 0
        camera.aspect = vw / vh;
        camera.position.z = vh / 2 / Math.tan((FOV * DEG) / 2);
        camera.far = camera.position.z + vw * 4;
        camera.updateProjectionMatrix();

        // Zoomed card (frame included): 1057 x 608 when it fits, smaller only when it does not
        const outerRatio = wide ? ACTIVE_W / ACTIVE_H : 0.8;
        const A = Math.min(ACTIVE_W, vw * g.maxW, (vh - g.reserve) * outerRatio);
        const u = A / ACTIVE_W; // 1 on a big screen
        const cs = g.centerScale;

        // everything below is for the normal (not zoomed) card; the group scale of the active card is cs
        const k = (u * g.thick) / cs;
        const pad = FRAME_PX.pad * k;
        const photoW = (A - 2 * FRAME_PX.pad * u * g.thick) / cs;
        const photoH = wide ? photoW / PHOTO_ASPECT : photoW * 1.25;
        const outerW = photoW + 2 * pad;
        const outerH = photoH + 2 * pad;

        m.vw = vw;
        m.vh = vh;
        m.cardW = photoW;
        m.cardH = photoH;
        m.R = g.R * (outerW / 2);
        m.zk = g.zk;
        m.turn = g.cardsPerTurn;
        m.step = 360 / g.cardsPerTurn;
        m.spacing = g.spacing * outerH;
        m.cx0 = g.cx0 * vw;
        m.cx1 = g.cx1 * vw;
        m.cy0 = g.cy0 * vh;
        m.cy1 = g.cy1 * vh;
        m.rotY = g.rotY;
        m.yaw = g.yaw;
        m.tilt = g.tilt;
        m.centerScale = cs;

        kit.resize(
          photoW,
          photoH,
          pad,
          FRAME_PX.depth * k,
          FRAME_PX.bevel * k,
          FRAME_PX.recess * k
        );
        canvas.dataset.activeCard = `${Math.round(A)}x${Math.round(outerH * cs)}`;
        cards.forEach(crop);
        dirty = true;
      };

      // ---------- draw one frame ----------
      const update = () => {
        const { intro, p } = state;
        const cx = m.cx0 + (m.cx1 - m.cx0) * intro - m.vw / 2;
        const cy = m.cy0 + (m.cy1 - m.cy0) * intro - m.vh / 2;
        const introScale = INTRO_SCALE + (1 - INTRO_SCALE) * intro;

        cards.forEach((c, i) => {
          const g = c.frame.group;
          const d = i - p; // position on the spiral (0 = front and centre)
          const ad = Math.abs(d);

          // Every neighbour is always there, fully visible, with no fade-in.
          // Only cards far outside the screen are skipped.
          if (ad > 4.2) {
            g.visible = false;
            return;
          }
          g.visible = true;

          // Helix: each card sits on the cylinder and faces outwards
          const angle = d * m.step * DEG;
          const focus = 1 - Math.min(ad / FOCUS_RANGE, 1);
          const scale = (1 + (m.centerScale - 1) * focus) * introScale;

          g.position.set(
            cx + Math.sin(angle) * m.R,
            -(cy + d * m.spacing),
            (Math.cos(angle) - 1) * m.R * m.zk
          );
          g.rotation.set(
            0,
            angle * m.rotY + m.yaw * DEG,
            -m.tilt * (1 - 0.75 * focus) * DEG
          );
          g.scale.setScalar(scale);

          c.frame.setOpacity(1);
        });

        // Title fades and drifts up while the first image zooms
        copy.style.opacity = (1 - smooth(0, 0.55, intro)).toFixed(3);
        copy.style.transform = `translate3d(0, ${(-intro * 50).toFixed(1)}px, 0)`;

        // Background drifts slowly with the travel
        bg.style.transform = `translate3d(${(-p * 0.3).toFixed(2)}vw, 0, 0)`;

        // Progress line
        bar.style.transform = `scaleX(${((p + 1) / N).toFixed(4)})`;

        // Debug attributes (same names as the reference canvas)
        const idx = clamp(Math.round(p), 0, N - 1);
        canvas.dataset.currentPhotoIndex = String(idx);
        canvas.dataset.tourProgress = (p / (N - 1)).toFixed(5);

        // Caption + sharp textures only update when the nearest image changes
        if (idx !== lastIndex) {
          lastIndex = idx;
          currentIndex = idx;
          setActive(idx);
          balance();
        }
      };

      let frames = 0;
      let lastDraw = 0;
      let firstFrame = false;

      const draw = () => {
        if (disposed) return;
        const now = performance.now();
        if (!dirty || !visible) {
          if (canvas.dataset.renderActive === "true" && now - lastDraw > 200) {
            canvas.dataset.renderActive = "false";
          }
          return;
        }
        dirty = false;
        update();
        renderer.render(scene, camera);
        lastDraw = now;
        frames += 1;
        canvas.dataset.renderFrames = String(frames);
        canvas.dataset.renderActive = "true";
        if (!firstFrame && cards[0].map) {
          firstFrame = true;
          setReady(true); // the still image fades out, the canvas fades in
        }
      };
      gsap.ticker.add(draw);

      // Do not draw while the section is off screen
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) dirty = true;
      });
      io.observe(stage);

      // ---------- click on the active photo ----------
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const overActive = (x: number, y: number) => {
        const card = cards[currentIndex];
        if (!card || !card.frame.group.visible) return false;
        const rect = canvas.getBoundingClientRect();
        ndc.set(
          ((x - rect.left) / rect.width) * 2 - 1,
          -((y - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(ndc, camera);
        return (
          raycaster.intersectObjects([card.frame.photo, card.frame.rim], false)
            .length > 0
        );
      };

      let moveRaf = 0;
      const onMove = (event: PointerEvent) => {
        if (event.pointerType === "touch" || moveRaf) return;
        const { clientX, clientY } = event;
        moveRaf = requestAnimationFrame(() => {
          moveRaf = 0;
          canvas.style.cursor = overActive(clientX, clientY) ? "pointer" : "default";
        });
      };
      const onLeave = () => {
        canvas.style.cursor = "default";
      };
      const onClick = (event: MouseEvent) => {
        if (overActive(event.clientX, event.clientY)) {
          openViewer(slides[currentIndex]);
        }
      };
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("click", onClick);

      // ---------- first photos ----------
      const timers: number[] = [];
      for (let i = 0; i < N; i++) {
        if (i < 5) load(i);
        else timers.push(window.setTimeout(() => load(i), 800 + (i - 5) * 250));
      }
      stats();

      // ---------- scroll ----------
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * PER_UNIT * TOTAL)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: layout,
        },
      });

      const markDirty = () => {
        dirty = true;
      };
      // 1) zoom of the first image
      tl.to(state, { intro: 1, duration: INTRO, ease: "power1.inOut", onUpdate: markDirty }, 0);
      // 2) spiral travel through all images
      tl.to(state, { p: N - 1, duration: N - 1, onUpdate: markDirty }, INTRO);
      // 3) hold on the last image
      tl.to({}, { duration: TAIL }, INTRO + N - 1);

      triggerRef.current = tl.scrollTrigger ?? null;

      const resizeObserver = new ResizeObserver(layout);
      resizeObserver.observe(stage);
      layout();

      // Cleanup (also runs in React Strict Mode)
      return () => {
        disposed = true;
        triggerRef.current = null;
        setReady(false);
        timers.forEach((t) => window.clearTimeout(t));
        if (moveRaf) cancelAnimationFrame(moveRaf);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("click", onClick);
        gsap.ticker.remove(draw);
        io.disconnect();
        resizeObserver.disconnect();
        cards.forEach((c) => {
          c.low?.dispose();
          c.high?.dispose();
        });
        kit.dispose();
        envTarget.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      };
    });

    // Removes timeline, pin, ScrollTrigger and the cleanup above
    return () => mm.revert();
  }, [openViewer]);

  // Arrows / select: scroll to the position of that image
  const go = (target: number) => {
    const i = clamp(Math.round(target), 0, N - 1);
    const st = triggerRef.current;
    if (!st) return;
    const y = st.start + (st.end - st.start) * ((INTRO + i) / TOTAL);
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const current = slides[active];

  return (
    <section
      className={`sp${mode === "static" ? " sp-static" : ""}${ready ? " sp-ready" : ""}`}
      id="perspectiva"
      data-header-theme="dark"
      aria-labelledby="sp-title"
    >
      <div ref={stageRef} className="sp-stage">
        <div ref={bgRef} className="sp-bg" aria-hidden="true" />

        {/* Still image: shown until the 3D canvas has drawn its first frame */}
        <Image
          className="sp-still"
          src={slides[0].src}
          alt=""
          fill
          sizes="100vw"
          quality={70}
          decoding="async"
          style={{ objectFit: "cover", objectPosition: slides[0].pos }}
        />

        {/* Three.js canvas is added here */}
        <div ref={glRef} className="sp-gl" role="img" aria-label={current.alt} />

        <div className="sp-top">
          <span>AZIMUTE / EXPERIÊNCIA</span>
          <span>
            DESÇA PARA EXPLORAR <i aria-hidden="true">↓</i>
          </span>
        </div>

        <div ref={copyRef} className="sp-copy">
          <p className="sp-eyebrow">ARQUITETURA · LUZ · VIDA</p>
          <h2 id="sp-title" className="sp-title">
            Uma nova
            <br />
            <em>perspectiva.</em>
          </h2>
          <p className="sp-lead">
            O olhar encontra
            <br />
            outra forma de viver.
          </p>
        </div>

        {/* Only visible in the simple (reduced motion / no WebGL) version */}
        <div className="sp-cards">
          {slides.map((slide) => (
            <figure className="sp-card" key={slide.src}>
              <div className="sp-img">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 700px) 90vw, 80vw"
                  quality={80}
                  loading="lazy"
                  style={{ objectFit: "cover", objectPosition: slide.pos }}
                />
              </div>
              <figcaption className="sp-figcap">{slide.title}</figcaption>
            </figure>
          ))}
        </div>

        <div className="sp-bottom">
          <div className="sp-row">
            <div className="sp-caption">
              <span className="sp-count">
                {pad2(active + 1)} / {pad2(N)}
              </span>
              <h3>{current.title}</h3>
            </div>

            <div className="sp-controls">
              <button
                type="button"
                aria-label="Imagem anterior"
                disabled={active === 0}
                onClick={() => go(active - 1)}
              >
                ←
              </button>
              <select
                aria-label="Ir para a imagem"
                value={active}
                onChange={(event) => go(Number(event.target.value))}
              >
                {slides.map((slide, i) => (
                  <option key={slide.src} value={i}>
                    {pad2(i + 1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Próxima imagem"
                disabled={active === N - 1}
                onClick={() => go(active + 1)}
              >
                →
              </button>
                <button
                type="button"
                className="sp-open"
                onClick={() => openViewer(current)}
              >
                Ampliar imagem <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>

          <div className="sp-progress" aria-hidden="true">
            <div ref={barRef} className="sp-progress-bar" />
          </div>

          <a className="sp-continue" href={NEXT_HREF}>
            Continuar no site <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}