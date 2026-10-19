export default function ProjectSection() {
  return (
    <section
      className="pj"
      id="projeto"
      data-header-theme="light"
      aria-labelledby="pj-title"
    >
      <div className="pj-label">
        <span>01 / O projeto</span>
        <span>Vila Vitória · Mauá / SP</span>
      </div>

      <div className="pj-grid">
        <h2 id="pj-title" className="pj-title">
          <span>A VIDA EM</span>
          <em>boa direção.</em>
        </h2>

        <div className="pj-text">
          <p>
            Ambientes que se conectam.
            <br />
            Espaço para estar, receber e viver.
          </p>
          <p>
            Na Vila Vitória, em Mauá, conheça o Azimute: apartamentos com
            ambientes integrados e varanda gourmet, em um projeto da ASL.
          </p>
          <span className="pj-sign">ASL INCORPORADORA E CONSTRUTORA</span>
        </div>
      </div>
    </section>
  );
}