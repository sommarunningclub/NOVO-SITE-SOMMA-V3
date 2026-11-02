import { CORES, EVENTO_URL, SITE_URL } from "@/lib/dexcomplica-love-run/event.config";
import { DISPLAY, TEXTO, bloco, botao, casca, esc, eyebrow, letreiro, linkSeta, p, titulo } from "./dexcomplica-love-run-layout";

/**
 * E-mail avulso de 02/11/2026 para os inscritos: quem descobrir que não vai
 * poder ir pode passar a vaga para outra pessoa pelo próprio site. O passo a
 * passo segue a tela do bloco "Acessar meu ingresso" da LP (PR #77) e as
 * regras de `transferirIngresso` (prazo em TRANSFERENCIA_LIMITE, sem vaga
 * nova, destino não pode estar inscrito, nada depois do check-in).
 * Personalizado por pessoa (link do ingresso), então sai por script.
 */
export const ASSUNTO_COMO_TRANSFERIR = "Love Run: não vai poder ir? Passa sua vaga pra alguém";
/** 2º envio, 24 h depois, só para quem não abriu o 1º: mesmo conteúdo, outro assunto. */
export const ASSUNTO_LEMBRETE_TRANSFERIR = "Lembrete: não vai poder ir ao Love Run? Dá para passar sua vaga";

const PASSOS: [string, string][] = [
  ["Acesse o seu ingresso", "Na página do Love Run, vá em <strong>Acessar meu ingresso</strong>. O botão aqui embaixo já leva direto para lá."],
  ["Confirme seus dados", "Informe o <strong>CPF</strong> e o <strong>e-mail</strong> que você usou na inscrição e toque em <strong>Acessar</strong>."],
  ["Preencha quem vai no seu lugar", "Toque em <strong>Transferir este ingresso</strong> e preencha os dados da pessoa: nome completo, e-mail, WhatsApp, CPF, sexo e pelotão."],
  ["Confirme a transferência", "Marque que você tem a autorização da pessoa e toque em <strong>Transferir ingresso</strong>. Pronto: o ingresso vai na hora para o e-mail dela."],
];

const REGRAS = [
  "A vaga é a mesma: o ingresso passa para a outra pessoa com um QR Code novo, e o seu deixa de valer.",
  "Quem recebe não pode já estar inscrito no Love Run.",
  "Dá para transferir até as 06h30 do sábado, 07/11.",
  "Ingresso que já passou pelo check-in não pode ser transferido.",
];

function passoAPasso(): string {
  return bloco(
    `<div style="font-family:${DISPLAY};font-size:34px;line-height:38px;color:${CORES.tinta};text-transform:uppercase;margin:0 0 14px">Passo a passo</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${PASSOS.map(
      ([t, d], i) =>
        `<tr><td valign="top" width="54" style="padding:14px 0;border-top:2px solid ${CORES.tinta}"><div style="width:38px;height:38px;line-height:38px;border-radius:999px;background:${CORES.tinta};color:${CORES.amarelo};text-align:center;font-family:${DISPLAY};font-size:20px">${i + 1}</div></td><td style="padding:14px 0;border-top:2px solid ${CORES.tinta};font-family:${TEXTO};color:${CORES.tinta}"><div style="font-size:18px;font-weight:800;line-height:24px">${t}</div><div style="font-size:15px;line-height:22px;color:#3a3326;margin-top:3px">${d}</div></td></tr>`
    ).join("")}</table>
    <div style="margin-top:14px">${botao("Transferir meu ingresso", `${EVENTO_URL}#meu-ingresso`, "vermelho")}</div>`,
    { fundo: CORES.amarelo, cor: CORES.tinta }
  );
}

function bomSaber(): string {
  return bloco(
    eyebrow("Bom saber", CORES.amarelo) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${REGRAS.map(
        (r, i) =>
          `<tr><td valign="top" width="30" style="padding:8px 0;font-size:18px;color:${i % 2 ? CORES.rosa : CORES.vermelho}">&#9829;</td><td style="padding:8px 0;font-family:${TEXTO};font-size:16px;line-height:24px;color:#e6e1da">${r}</td></tr>`
      ).join("")}</table>`
  );
}

export function renderComoTransferir(d: { nome: string; urlIngresso: string; base?: string }): string {
  const nome = esc(d.nome.trim().split(/\s+/)[0] || d.nome);
  const corpo = [
    letreiro(),
    bloco(
      eyebrow("Transferência de ingresso") +
        titulo(`${nome}, imprevisto`, "#ffffff", "acontece.") +
        p(
          "Se você descobrir que não vai conseguir ir ao Love Run no sábado, não deixa a vaga parada: dá para <strong style=\"color:#ffffff\">transferir o seu ingresso para outra pessoa</strong>, em poucos minutos e direto pelo site."
        ) +
        p("As vagas são limitadas, então quem ficou de fora agradece."),
      { padBottom: 30 }
    ),
    passoAPasso(),
    bomSaber(),
    bloco(
      eyebrow("Vai correr com a gente?", CORES.amarelo) +
        p("Então não precisa fazer nada. É só levar o QR Code do seu ingresso no sábado.", "#ffffff") +
        `<div style="margin-top:6px">${linkSeta("Abrir meu ingresso", d.urlIngresso)}</div>`,
      { fundo: CORES.vermelho }
    ),
  ].join("");

  return casca({
    base: d.base ?? SITE_URL,
    preheader: "Em 4 passos, direto pelo site, até as 06h30 do sábado.",
    heroi: { arquivo: "transferir.jpg", alt: "Não vai poder ir? Passa a vaga. Dexcomplica Love Run, sábado 07.11" },
    corpo,
  });
}

export function textoComoTransferir(d: { nome: string; urlIngresso: string }): string {
  return [
    `Oi, ${d.nome.trim().split(/\s+/)[0]}! Se você descobrir que não vai conseguir ir ao Love Run no sábado, dá para transferir o seu ingresso para outra pessoa pelo site.`,
    "",
    ...PASSOS.map(([t, desc], i) => `${i + 1}. ${t}: ${desc.replace(/<[^>]+>/g, "")}`),
    `\nTransferir: ${EVENTO_URL}#meu-ingresso`,
    "",
    ...REGRAS.map((r) => `- ${r}`),
    `\nVai correr? Seu ingresso: ${d.urlIngresso}`,
    "\nSomma Club × Dexcomplica · produção Monu",
  ].join("\n");
}
