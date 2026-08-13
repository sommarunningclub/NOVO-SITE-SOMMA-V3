import { getEmailFrom, getResendClient } from "@/lib/resend";
import {
  EVENT,
  EVENT_PATH,
  SITE_URL,
  UNITS,
  VAGAS_POR_CATEGORIA,
  VAGAS_TOTAIS,
} from "@/lib/desafio-esteiras/event.config";
import { EMAIL_EVOLVE_LOGO_URL, EMAIL_SOMMA_LOGO_URL } from "./desafio-esteiras-ticket";

/**
 * Convite do Desafio das Esteiras para a base do SOMMA Club.
 *
 * Não é o ticket: aqui ninguém está inscrito ainda. O trabalho deste e-mail é
 * um só, levar a pessoa até a página de inscrição, então ele tem um botão só e
 * nenhuma informação que não ajude a decidir.
 *
 * Mesmas restrições do template do ticket, porque as caixas de entrada não
 * mudaram: tabelas em vez de flex, CSS inline, nada de gradient (a barra de
 * energia é feita de duas metades sólidas) e largura travada em 560px.
 *
 * Todo número aqui vem do event.config. Se a regra do evento mudar, o convite
 * muda junto — nada é escrito à mão.
 */

export interface DesafioEsteirasConviteData {
  /** Primeiro nome de quem recebe. Sem ele o e-mail abre sem saudação nominal. */
  nome?: string | null;
  /** Data URI das logos no preview; em produção entram as URLs públicas. */
  evolveLogoSrc?: string;
  sommaLogoSrc?: string;
  /** UTMs para separar o tráfego do e-mail no painel. */
  utm?: string;
  /** Link de descadastro da lista. Quando ausente, o rodapé não promete o que não existe. */
  descadastroUrl?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

export const CONVITE_SUBJECTS = [
  "19/08: quatro unidades correndo ao mesmo tempo",
  `Desafio das Esteiras: ${VAGAS_TOTAIS} vagas para competir`,
  "Você contra a esteira. Sua unidade contra todas.",
] as const;

export function desafioEsteirasConviteSubject(variante = 0): string {
  return CONVITE_SUBJECTS[variante] ?? CONVITE_SUBJECTS[0];
}

/** Aparece na lista da caixa de entrada, ao lado do assunto. */
export function desafioEsteirasConvitePreheader(): string {
  return `${EVENT.dataExtenso}, ${EVENT.horaExtenso}. Evolve e SOMMA Club. Inscrição gratuita e vaga limitada para competir.`;
}

export function renderDesafioEsteirasConviteEmail(data: DesafioEsteirasConviteData = {}): string {
  const evolveLogo = data.evolveLogoSrc ?? EMAIL_EVOLVE_LOGO_URL;
  const sommaLogo = data.sommaLogoSrc ?? EMAIL_SOMMA_LOGO_URL;
  const utm = data.utm ?? "utm_source=email&utm_medium=convite&utm_campaign=desafio-esteiras";
  const link = `${SITE_URL}${EVENT_PATH}?${utm}`;
  const linkInscricao = `${SITE_URL}${EVENT_PATH}/inscricao?${utm}`;

  const saudacao = data.nome
    ? `Oi, <strong style="color:#08080a;">${escapeHtml(firstName(data.nome))}</strong>.`
    : "Oi!";

  // As unidades saem do config: quatro linhas, com a base do SOMMA marcada.
  const unidades = UNITS.map((u) => {
    const selo = u.sommaBase
      ? `<span style="display:inline-block;background:#ff2c04;color:#08080a;font-family:'Courier New',Courier,monospace;font-size:9px;font-weight:bold;letter-spacing:0.14em;padding:3px 6px;margin-left:8px;vertical-align:middle;">SOMMA AQUI</span>`
      : "";
    return `<tr>
      <td style="padding:9px 0;border-bottom:1px solid #dedbd5;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#08080a;">
        <strong>${escapeHtml(u.curto)}</strong>${selo}
        <span style="display:block;font-size:13px;color:#6c6a66;padding-top:3px;">${escapeHtml(u.cidade)}/${escapeHtml(u.uf)}</span>
      </td>
    </tr>`;
  }).join("");

  const dado = (rotulo: string, valor: string, destaque = false) => `
    <td width="33.33%" align="center" style="padding:16px 6px;border-right:1px solid #dedbd5;">
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">${rotulo}</p>
      <p style="margin:8px 0 0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:26px;line-height:1;color:${destaque ? "#e0261b" : "#08080a"};font-weight:900;">${valor}</p>
    </td>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(EVENT.nome)}</title>
  <style>
    @media only screen and (max-width:600px) {
      .outer-pad { padding: 16px 10px !important; }
      .pad-body { padding: 24px 20px 8px !important; }
      .pad-head { padding: 16px 20px !important; }
      .pad-foot { padding: 20px !important; }
      .title { font-size: 34px !important; }
      .btn-text { padding: 17px 12px !important; font-size: 13px !important; }
      .logo-ev { width: 68px !important; height: 18px !important; }
      .logo-so { width: 67px !important; height: 18px !important; }
      .logo-x { font-size: 10px !important; padding: 0 6px !important; }
      .dado-n { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#08080a;width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#08080a;opacity:0;">
    ${escapeHtml(desafioEsteirasConvitePreheader())}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080a;width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:28px 16px;">

        <!--[if mso]>
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" class="shell" width="560" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:560px;background:#f2f0ec;">

          <!-- Cabeçalho -->
          <tr>
            <td class="pad-head" bgcolor="#08080a" style="background:#08080a;padding:20px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle" style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding:0;line-height:0;">
                          <img class="logo-ev" src="${evolveLogo}" alt="Evolve" width="84" height="22" style="display:block;width:84px;height:22px;border:0;outline:none;" />
                        </td>
                        <td class="logo-x" valign="middle" style="padding:0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1;color:#ff2c04;font-weight:bold;">×</td>
                        <td valign="middle" style="padding:0;line-height:0;">
                          <img class="logo-so" src="${sommaLogo}" alt="SOMMA Club" width="82" height="22" style="display:block;width:82px;height:22px;border:0;outline:none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8a8884;white-space:nowrap;padding-left:12px;">
                    Convite
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Barra de energia (duas metades sólidas: e-mail não carrega gradient) -->
          <tr>
            <td style="padding:0;font-size:0;line-height:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" height="3" bgcolor="#e0261b" style="background:#e0261b;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="50%" height="3" bgcolor="#ff2c04" style="background:#ff2c04;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Chamada -->
          <tr>
            <td class="pad-body" bgcolor="#f2f0ec" style="background:#f2f0ec;padding:30px 28px 14px;">
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#e0261b;">
                ${escapeHtml(EVENT.realizacao)}
              </p>
              <h1 class="title" style="margin:10px 0 0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:40px;line-height:0.86;letter-spacing:-0.04em;text-transform:uppercase;color:#08080a;font-weight:900;">
                DESAFIO<br />DAS ESTEIRAS
              </h1>
              <p style="margin:14px 0 0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:17px;line-height:1.2;text-transform:uppercase;color:#e0261b;font-weight:900;letter-spacing:-0.01em;">
                Você contra a esteira.<br />Sua unidade contra todas.
              </p>

              <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#3a3a3e;">
                ${saudacao} No dia <strong style="color:#08080a;">${escapeHtml(EVENT.dataExtenso)}</strong>, às
                <strong style="color:#08080a;">${escapeHtml(EVENT.horaExtenso)}</strong>, quatro unidades da Evolve
                viram um só evento. Música, ativações, brindes e gente de todos os níveis correndo junto.
              </p>
            </td>
          </tr>

          <!-- Os três números que importam -->
          <tr>
            <td style="padding:22px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #dedbd5;background:#ffffff;">
                <tr>
                  ${dado("Data", EVENT.dataLabel)}
                  ${dado("Início", EVENT.horaLabel)}
                  <td width="33.33%" align="center" style="padding:16px 6px;">
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">Vagas</p>
                    <p class="dado-n" style="margin:8px 0 0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:26px;line-height:1;color:#e0261b;font-weight:900;">${VAGAS_TOTAIS}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- A regra, em uma frase -->
          <tr>
            <td style="padding:18px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-left:3px solid #ff2c04;">
                <tr>
                  <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#3a3a3e;">
                    São <strong style="color:#08080a;">${VAGAS_POR_CATEGORIA} vagas no feminino e ${VAGAS_POR_CATEGORIA} no masculino</strong>
                    em cada unidade, distribuídas em 3 baterias de 4 esteiras. Quando a sua categoria lota, acabou.
                    <br /><br />
                    Não precisa ser atleta. Dá para competir ou só chegar, assistir e curtir a noite.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:26px 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" bgcolor="#e0261b" style="background:#e0261b;">
                    <a href="${linkInscricao}" target="_blank" style="display:block;text-decoration:none;">
                      <span class="btn-text" style="display:block;padding:19px 16px;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:15px;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;font-weight:900;">
                        Garantir minha vaga
                      </span>
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:11px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8884;">
                Gratuito · leva menos de um minuto
              </p>
            </td>
          </tr>

          <!-- Unidades -->
          <tr>
            <td style="padding:28px 28px 0;">
              <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8884;">
                Onde vai rolar
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${unidades}
              </table>
              <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#6c6a66;">
                A equipe do SOMMA Club estará presencialmente na Vicente Pires.
              </p>
            </td>
          </tr>

          <!-- Respiro antes do rodapé: margin em td não vale em e-mail -->
          <tr><td height="30" style="height:30px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Rodapé -->
          <tr>
            <td class="pad-foot" bgcolor="#08080a" style="background:#08080a;padding:26px 28px;">
              <p style="margin:0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:20px;line-height:1;text-transform:uppercase;color:#f2f0ec;font-weight:900;letter-spacing:-0.02em;">
                ${escapeHtml(EVENT.dataLabel)} · ${escapeHtml(EVENT.horaLabel)}
              </p>
              <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8a8884;">
                Se o botão não abrir, use este endereço:<br />
                <a href="${link}" target="_blank" style="color:#ff2c04;text-decoration:underline;word-break:break-all;">${SITE_URL}${EVENT_PATH}</a>
              </p>
              ${
                data.descadastroUrl
                  ? `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#5c5a57;">
                Você recebe este e-mail porque faz parte da base do SOMMA Club.
                <a href="${escapeHtml(data.descadastroUrl)}" target="_blank" style="color:#8a8884;text-decoration:underline;">Descadastrar</a>.
              </p>`
                  : ""
              }
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Envio individual do convite.
 *
 * Deixada pronta mas não ligada a nenhuma rota: disparar para a base é uma
 * decisão de quem opera, não efeito colateral de um deploy. Para uma lista
 * grande, o caminho é a audiência do Resend (com descadastro nativo) em vez de
 * um laço chamando isto aqui.
 */
export async function sendDesafioEsteirasConvite(params: {
  email: string;
  nome?: string | null;
  variante?: number;
  descadastroUrl?: string | null;
}): Promise<{ ok: boolean; erro?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) return { ok: false, erro: "Resend não configurado." };

  try {
    await resend.emails.send({
      from,
      to: params.email,
      subject: desafioEsteirasConviteSubject(params.variante ?? 0),
      html: renderDesafioEsteirasConviteEmail({
        nome: params.nome ?? undefined,
        descadastroUrl: params.descadastroUrl ?? null,
      }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "Falha no envio." };
  }
}
