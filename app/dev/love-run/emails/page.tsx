import { notFound } from "next/navigation";
import { qrSvg } from "@/lib/dexcomplica-love-run/ticket";
import { SITE_URL } from "@/lib/dexcomplica-love-run/event.config";
import { assunto, renderIngressoEmail } from "@/lib/emails/dexcomplica-love-run-ingresso";
import { CAMPANHAS } from "@/lib/emails/dexcomplica-love-run-campanhas";
import CopiarHtml from "./CopiarHtml";

export const metadata = { title: "E-mails do Love Run", robots: { index: false, follow: false } };

const TOKEN_EXEMPLO = "previa_previa_previa_previa_previa_previa_x";

/**
 * Todos os e-mails do Love Run num lugar só (só em desenvolvimento).
 * Automáticos: saem do site na inscrição/recuperação. Campanhas: copiar o
 * HTML e colar na gestão (E-mail Marketing → HTML personalizado, base love_run).
 */
export default async function EmailsLoveRun() {
  if (process.env.NODE_ENV === "production") notFound();

  const qr = `data:image/svg+xml;utf8,${encodeURIComponent(await qrSvg(TOKEN_EXEMPLO))}`;
  const url = `${SITE_URL}/dexcomplica/ingresso/${TOKEN_EXEMPLO}`;
  const exemplo = (html: string) => html.replace(/\{\{\s*primeiro_nome\s*\}\}/g, "Maria").replace(/\{\{\s*nome\s*\}\}/g, "Maria Fernanda Silva");

  const itens = [
    {
      id: "confirmacao",
      tipo: "Automático",
      nome: "Confirmação da inscrição (com QR)",
      quando: "Na hora em que a inscrição é gravada",
      base: "A própria pessoa",
      assunto: assunto(false),
      pendencias: [] as string[],
      previa: renderIngressoEmail({ nome: "Maria Fernanda Silva", ticketCode: "DLR-8F4X29", url, pelotao: "6km", qrSrc: qr, base: "" }),
      copiar: null as string | null,
    },
    {
      id: "reenvio",
      tipo: "Automático",
      nome: "Reenvio do ingresso",
      quando: "Recuperar ingresso pelo CPF, ou nova tentativa com outro e-mail",
      base: "O e-mail da inscrição",
      assunto: assunto(true),
      pendencias: [],
      previa: renderIngressoEmail({ nome: "Maria Fernanda Silva", ticketCode: "DLR-8F4X29", url, pelotao: "6km", qrSrc: qr, reenvio: true, base: "" }),
      copiar: null,
    },
    ...CAMPANHAS.map((c) => ({
      id: c.id,
      tipo: "Campanha (gestão)",
      nome: c.nome,
      quando: c.quando,
      base: c.base,
      assunto: c.assunto,
      pendencias: c.pendencias,
      previa: exemplo(c.html("")),
      copiar: c.html(SITE_URL),
    })),
  ];

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", background: "#efeae3", minHeight: "100vh", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 32 }}>E-mails do Dexcomplica Love Run</h1>
        <p style={{ margin: "0 0 28px", color: "#555", maxWidth: 760 }}>
          Os automáticos saem sozinhos do site. As campanhas são para a base inteira de inscritos: copie o HTML e cole no
          admin (E-mail Marketing → HTML personalizado, base <strong>love_run</strong>). O nome de cada pessoa entra no lugar
          de {"{{primeiro_nome}}"}; o rodapé de descadastro é colocado pela gestão.
        </p>
        <div style={{ display: "grid", gap: 28 }}>
          {itens.map((i) => (
            <section key={i.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)", gap: 24, background: "#fff", borderRadius: 16, padding: 20 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: i.tipo === "Automático" ? "#1f8a4c" : "#c92a19" }}>{i.tipo}</span>
                <h2 style={{ margin: "6px 0 12px", fontSize: 22 }}>{i.nome}</h2>
                <dl style={{ margin: 0, display: "grid", gap: 10, fontSize: 14 }}>
                  <div><dt style={{ color: "#777" }}>Assunto</dt><dd style={{ margin: 0, fontWeight: 600 }}>{i.assunto}</dd></div>
                  <div><dt style={{ color: "#777" }}>Quando</dt><dd style={{ margin: 0 }}>{i.quando}</dd></div>
                  <div><dt style={{ color: "#777" }}>Para quem</dt><dd style={{ margin: 0 }}>{i.base}</dd></div>
                  <div>
                    <dt style={{ color: "#777" }}>Pendências</dt>
                    <dd style={{ margin: 0, color: i.pendencias.length ? "#b0170c" : "#1f8a4c", fontWeight: 600 }}>
                      {i.pendencias.length ? `Falta confirmar: ${i.pendencias.join(", ")}` : "Pronto para enviar"}
                    </dd>
                  </div>
                </dl>
                {i.copiar ? <CopiarHtml html={i.copiar} bloqueado={i.pendencias.length > 0} /> : null}
              </div>
              <iframe title={`Prévia: ${i.nome}`} srcDoc={i.previa} style={{ width: "100%", height: 1100, border: "1px solid #333", borderRadius: 12, background: "#0e0e0e" }} />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
