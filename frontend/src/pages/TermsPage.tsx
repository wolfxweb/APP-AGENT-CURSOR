import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <div className="auth-shell fade-in">
      <div className="auth-card auth-card-wide">
        <h1 className="auth-title">Termos de uso</h1>
        <p className="auth-sub">SuccessWay — termos para cadastro e uso da plataforma</p>
        <div className="stack muted" style={{ textAlign: "left", maxHeight: "60vh", overflowY: "auto" }}>
          <p>
            Ao criar uma conta, você declara ter lido e concordado com as regras de uso do
            SuccessWay, incluindo o tratamento dos dados informados para fins de gestão
            empresarial e diagnóstico de margens, conforme a política de privacidade aplicável.
          </p>
          <p>
            A chave de ativação é pessoal e intransferível. O compartilhamento indevido pode
            resultar em suspensão do acesso.
          </p>
          <p>
            O serviço é oferecido &quot;no estado em que se encontra&quot;; recomendações e
            simulações não substituem assessoria contábil ou jurídica profissional.
          </p>
        </div>
        <p className="auth-footer">
          <Link to="/auth/register">Voltar ao cadastro</Link>
        </p>
      </div>
    </div>
  );
}
