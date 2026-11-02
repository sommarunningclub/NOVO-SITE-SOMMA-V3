import Link from "next/link";

export default function IngressoNaoEncontrado() {
  return (
    <main className="lr-ing lr-ing--vazio">
      <div className="lr-ing__topo">
        <p className="lr-eyebrow lr-eyebrow--claro">Dexcomplica Love Run</p>
        <h1 className="lr-h2 lr-h2--claro">Ingresso não encontrado.</h1>
        <p className="lr-lead lr-lead--claro">
          O link pode estar incompleto, o ingresso foi transferido ou a inscrição foi cancelada. Na página do evento, acesse
          com CPF e e-mail da inscrição — ou peça o reenvio só com o CPF.
        </p>
        <Link href="/dexcomplica#meu-ingresso" className="lr-btn lr-btn--vermelho">
          Acessar meu ingresso
        </Link>
      </div>
    </main>
  );
}
