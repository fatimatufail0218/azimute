

export default function Residences() {
  return (
    <section
      className="rs"
      id="residencias"
      data-header-theme="light"
      aria-labelledby="rs-title"
    >
      <div>
        <p className="rs-eyebrow">02 / Residências</p>
        <h2 id="rs-title" className="rs-title">
          O seu espaço.
          <br />
          <em>O seu jeito.</em>
        </h2>
      </div>

      <div className="rs-facts">
        <div>
          <span>
            63 <i>e</i> 67 <small>m²</small>
          </span>
          <p>Áreas dos apartamentos</p>
        </div>
        <div>
          <span>
            2 <small>dormitórios</small>
          </span>
          <p>Com 1 suíte</p>
        </div>
        <div>
          <span>
            1 <i>ou</i> 2 <small>vagas</small>
          </span>
          <p>Conforme a unidade</p>
        </div>
      </div>
    </section>
  );
}