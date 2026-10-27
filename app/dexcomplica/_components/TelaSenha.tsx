import Image from "next/image";

/**
 * Porta da LP enquanto o evento não foi liberado. Formulário comum (POST para
 * /dexcomplica/acesso): funciona sem JavaScript e a senha nunca passa pelo
 * navegador como dado da página.
 */
export default function TelaSenha({ erro }: { erro?: string }) {
  const mensagem =
    erro === "limite"
      ? "Muitas tentativas. Aguarde alguns minutos e tente de novo."
      : erro
        ? "Senha incorreta. Confira e tente de novo."
        : null;

  return (
    <main className="lr-senha">
      <div className="lr-senha__caixa">
        <Image src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" width={525} height={502} className="lr-senha__coracao" priority />
        <Image src="/dexcomplica-love-run/marca/dex-logo.png" alt="Dexcomplica" width={900} height={194} className="lr-senha__logo" priority />
        <h1 className="lr-senha__titulo">
          Love Run <span>em preparação</span>
        </h1>
        <p className="lr-senha__texto">Esta página ainda não foi liberada. Digite a senha para ver a prévia.</p>
        <form method="post" action="/dexcomplica/acesso" className="lr-senha__form">
          <label htmlFor="lr-senha" className="sr-only">Senha</label>
          <input
            id="lr-senha"
            name="senha"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="Senha"
            required
            autoFocus
            aria-invalid={Boolean(mensagem)}
            aria-describedby={mensagem ? "lr-senha-erro" : undefined}
          />
          <button type="submit" className="lr-btn lr-btn--vermelho">Entrar</button>
        </form>
        {mensagem ? (
          <p id="lr-senha-erro" className="lr-senha__erro" role="alert">{mensagem}</p>
        ) : null}
        <a href="/check-in" className="lr-link-seta lr-link-seta--claro">Ver a agenda de novembro</a>
      </div>
    </main>
  );
}
