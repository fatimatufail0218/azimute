"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";

export type ViewerItem = {
  src: string;
  title: string;
  alt: string;
  pos?: string; // part of the photo kept visible in the Vertical (cropped) view
  portraitSrc?: string; // optional real vertical file for the Vertical view
};

type ViewerContext = { open: (item: ViewerItem) => void };

const Ctx = createContext<ViewerContext>({ open: () => {} });

/* Use anywhere: const { open } = useImageViewer(); open({ src, title, alt }) */
export const useImageViewer = () => useContext(Ctx);

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ViewerItem | null>(null);
  const [portrait, setPortrait] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const open = useCallback((next: ViewerItem) => {
    setPortrait(false);
    setItem(next);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  // Open the native <dialog> and lock page scroll while it is open
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!item || !dialog) return;
    if (!dialog.open) dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [item]);

  const src = item && portrait && item.portraitSrc ? item.portraitSrc : item?.src;

  return (
    <Ctx.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        className="iv"
        aria-labelledby={titleId}
        onClose={() => setItem(null)}
        onClick={(event) => {
          // click on the dark backdrop closes it
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        {item && src && (
          <div className="iv-in">
            <div className="iv-top">
              <p id={titleId}>{item.title}</p>
              <button
                type="button"
                className="iv-close"
                onClick={() => dialogRef.current?.close()}
              >
                Fechar <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="iv-modes" role="group" aria-label="Enquadramento">
              <button
                type="button"
                aria-pressed={!portrait}
                onClick={() => setPortrait(false)}
              >
                Horizontal
              </button>
              <button
                type="button"
                aria-pressed={portrait}
                onClick={() => setPortrait(true)}
              >
                Vertical
              </button>
            </div>

            <div className="iv-stage">
              <div className={`iv-frame${portrait ? " is-portrait" : ""}`}>
                <Image
                  src={src}
                  alt={item.alt}
                  fill
                  sizes="96vw"
                  quality={90}
                  style={{
                    objectFit: portrait ? "cover" : "contain",
                    objectPosition: portrait ? (item.pos ?? "50% 50%") : "50% 50%",
                  }}
                />
              </div>
            </div>

            <p className="iv-note">Perspectiva artística. Imagem ilustrativa.</p>
          </div>
        )}
      </dialog>
    </Ctx.Provider>
  );
}