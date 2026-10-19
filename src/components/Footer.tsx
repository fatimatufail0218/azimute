

import BrandLogo from "./BrandLogo";

/* CHANGE THIS to your own WhatsApp number (country code + number, no + or spaces) */
const WHATSAPP_URL =
  "https://wa.me/55XXXXXXXXXXX?text=Ol%C3%A1!%20Gostaria%20de%20conhecer%20o%20Residencial%20Azimute.";

export default function Footer() {
  return (
    <footer className="ft" id="contato" data-header-theme="dark">
      <p className="ft-invite">
        Uma nova direção <em>para morar.</em>
      </p>

      <div className="ft-cta">
        <p>
          Conheça as possibilidades do Azimute.
          <br />
          Converse com a equipe da ASL.
        </p>
        <a
          className="ft-button"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Converse com a ASL</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="ft-bottom">
        <a className="ft-logo" href="#inicio" aria-label="Azimute, voltar ao início">
          <BrandLogo />
        </a>

        <p className="ft-address">
          Vila Vitória · Mauá / SP
          <br />
          ASL Incorporadora e Construtora
        </p>

        <a className="ft-top" href="#inicio">
          Voltar ao início <span aria-hidden="true">↑</span>
        </a>
      </div>

      <p className="ft-note">
        Imagens ilustrativas. Mobiliário, decoração e paisagismo são sugestões
        de ambientação. Características e disponibilidade devem ser confirmadas
        com a ASL.
      </p>
    </footer>
  );
}