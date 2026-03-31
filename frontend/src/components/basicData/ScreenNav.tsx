import { Link } from "react-router-dom";

export default function BasicDataScreenNav() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.5rem",
        marginBottom: "1.25rem",
      }}
    >
      <Link to="/" className="bd-nav-btn">
        Índice
      </Link>
      <Link to="/basic-data/new" className="bd-nav-btn bd-nav-btn--primary">
        Dados básicos
      </Link>
      <Link to="/diagnostico" className="bd-nav-btn">
        Diagnóstico
      </Link>
      <Link to="/gestao-prioridades" className="bd-nav-btn">
        Prioridades
      </Link>
      <Link to="/simulador" className="bd-nav-btn">
        Simulador
      </Link>
      <Link to="/calculadora" className="bd-nav-btn">
        Calculadora de preços
      </Link>
      <Link to="/importancia-meses" className="bd-nav-btn">
        Importância dos meses
      </Link>
      <Link to="/produtos" className="bd-nav-btn">
        Categorias e produtos
      </Link>
    </div>
  );
}
