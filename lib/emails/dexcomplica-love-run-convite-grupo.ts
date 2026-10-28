import { CORES, GRUPO_WHATSAPP, SITE_URL } from "@/lib/dexcomplica-love-run/event.config";
import { bloco, botao, casca, esc, eyebrow, letreiro, linkSeta, p, titulo } from "./dexcomplica-love-run-layout";

/**
 * E-mail avulso de 28/10/2026 para quem se inscreveu ANTES de o grupo do
 * WhatsApp e o campo de telefone existirem: convida para o grupo e, para
 * quem ficou sem número, leva ao próprio ingresso (#whatsapp) para completar.
 * Personalizado por pessoa (link do ingresso), então sai por script, não pela
 * campanha da gestão.
 */
export function assuntoConviteGrupo(semTelefone: boolean): string {
  return semTelefone
    ? "Love Run: entra no grupo do evento e completa seu WhatsApp"
    : "Love Run: entra no grupo do evento no WhatsApp";
}

export function renderConviteGrupo(d: { nome: string; urlIngresso: string; semTelefone: boolean; base?: string }): string {
  const nome = esc(d.nome.trim().split(/\s+/)[0] || d.nome);
  const corpo = [
    letreiro(),
    bloco(
      eyebrow("Novidade do Love Run") +
        titulo(`${nome}, o corre`, "#ffffff", "ganhou um grupo.") +
        p(
          `É no grupo <strong style="color:#ffffff">${GRUPO_WHATSAPP.nome}</strong> do WhatsApp que vamos passar as novidades e as informações do corre. Entra agora para não perder nada.`
        ) +
        botao("Entrar no grupo do WhatsApp", GRUPO_WHATSAPP.url, "whatsapp"),
      { padBottom: 30 }
    ),
    d.semTelefone
      ? bloco(
          eyebrow("Falta só uma coisa", CORES.tinta) +
            titulo("Seu WhatsApp", CORES.tinta, "ficou de fora.", CORES.vermelho) +
            p(
              "Sua inscrição está confirmada, mas ela entrou sem o número do WhatsApp. Leva 10 segundos: toque no botão, informe o número com DDD e pronto.",
              CORES.tinta
            ) +
            botao("Completar meu WhatsApp", `${d.urlIngresso}#whatsapp`, "vermelho"),
          { fundo: CORES.amarelo, cor: CORES.tinta }
        )
      : "",
    bloco(
      eyebrow("Seu ingresso", CORES.amarelo) +
        p("Seu ingresso com QR Code continua no mesmo lugar. É ele que você mostra no check-in, no sábado, 7 de novembro.", "#ffffff") +
        `<div style="margin-top:6px">${linkSeta("Abrir meu ingresso", d.urlIngresso)}</div>`,
      { fundo: CORES.vermelho }
    ),
  ].join("");

  return casca({
    base: d.base ?? SITE_URL,
    preheader: d.semTelefone
      ? "Entra no grupo do Love Run e completa seu WhatsApp em 10 segundos."
      : "É no grupo do WhatsApp que saem as novidades do Love Run.",
    heroi: { arquivo: "grupo.jpg", alt: "Entra no grupo! Dexcomplica Love Run, sábado 07.11" },
    corpo,
  });
}

export function textoConviteGrupo(d: { nome: string; urlIngresso: string; semTelefone: boolean }): string {
  return [
    `Oi, ${d.nome.trim().split(/\s+/)[0]}! O Love Run ganhou um grupo no WhatsApp (${GRUPO_WHATSAPP.nome}), onde vamos passar as novidades e as informações do corre.`,
    `Entrar no grupo: ${GRUPO_WHATSAPP.url}`,
    d.semTelefone ? `\nSua inscrição entrou sem o WhatsApp. Complete aqui: ${d.urlIngresso}#whatsapp` : "",
    `\nSeu ingresso: ${d.urlIngresso}`,
    "\nSomma Club × Dexcomplica · produção Monu",
  ]
    .filter(Boolean)
    .join("\n");
}
