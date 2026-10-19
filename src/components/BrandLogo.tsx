import Image from "next/image";

/*
 * Brand logo = symbol + wordmark + "RESIDENCIAL" text.
 * It has no link of its own: put it inside an <a> (see Header.tsx and Footer.tsx).
 * Sizes are set in globals.css, section "3b. LOGO".
 */
export default function BrandLogo() {
  return (
    <>
      <Image
        className="brand-symbol"
        src="/azimute-symbol.svg"
        alt=""
        width={50}
        height={40}
        unoptimized
      />
      <span className="brand-lockup">
        <Image
          className="brand-wordmark"
          src="/azimute-wordmark.svg"
          alt=""
          width={148}
          height={22}
          unoptimized
        />
        <span className="brand-sub">RESIDENCIAL</span>
      </span>
    </>
  );
}