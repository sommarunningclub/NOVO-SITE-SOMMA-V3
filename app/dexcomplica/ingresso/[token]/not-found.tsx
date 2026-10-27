import Link from "next/link";

export default function IngressoNaoEncontrado() {
  return (
    <main className="lr-ing lr-ing--vazio">
      <div className="lr-ing__topo">
        <p className="lr-eyebrow lr-eyebrow--claro">Dexcomplica Love Run</p>
        <h1 className="lr-h2 lr-h2--claro">Ingresso não encontrado.</h1>
        <p className="lr-lead lr-lead--claro">
          O link pode estar incompleto ou a inscrição foi cancelada. Na página do evento você pode pedir o ingresso de novo
          pelo CPF: ele chega no e-mail usado na inscrição.
        </p>
        <Link href="/dexcomplica#inscricao" className="lr-btn lr-btn--vermelho">
          Recuperar meu ingresso
        </Link>
      </div>
    </main>
  );
}
