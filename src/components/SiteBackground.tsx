import Image from "next/image";

/* Crystal image, fixed behind the whole site. File goes in public/. */
const CRYSTAL_SRC = "/crystal-bg.webp";

export default function SiteBackground() {
  return (
    <div className="site-bg" aria-hidden="true">
      <Image src={CRYSTAL_SRC} alt="" fill sizes="100vw" quality={75} />
    </div>
  );
}