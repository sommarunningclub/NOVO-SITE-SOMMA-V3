/**
 * Testes de unidade do Dexcomplica Love Run.
 *
 *   npx tsx scripts/love-run-unit.mts
 *
 * Guardam as regras que decidem se alguém entra: quando a inscrição abre
 * (nunca sem pelotão oficial e teto de vagas), o que conta como CPF/nome/
 * e-mail válidos, e o formato do código do ingresso que o balcão digita.
 */
import { estadoDaInscricao, liberado, pelotoesValidos, rotuloPelotao } from "../lib/dexcomplica-love-run/estado";
import { prazoTransferenciaPassou } from "../lib/dexcomplica-love-run/event.config";
import { inscricaoSchema, mascararCpf, mascararTelefone, perfilAcessoSchema, recuperarSchema, sugestaoEmail, transferenciaSchema } from "../lib/dexcomplica-love-run/schema";
import { cpfsAnteriores, destinoDaTransferencia, emailsIguais, parseTransferencias, transferenciaDestaOrigem } from "../lib/dexcomplica-love-run/transferencia";

let ok = 0, bad = 0;
const t = (n: string, c: boolean, d: unknown = "") => { c ? (ok++, console.log("  ✓", n)) : (bad++, console.log("  ✗", n, d)); };

const aberto = { checkin_status: "aberto", evento_encerrado: false, pelotoes: ["5km", "8km"], capacidade: 300 };

console.log("Estado da inscrição");
t("sem linha no banco → em breve", estadoDaInscricao(null, 0).estado === "em_breve");
t("aberto, com pelotões e vagas → abertas", estadoDaInscricao(aberto, 10).estado === "abertas");
t("aberto SEM pelotões → em breve (não inventa opção)", estadoDaInscricao({ ...aberto, pelotoes: [] }, 0).estado === "em_breve");
t("aberto com pelotão em branco → em breve", estadoDaInscricao({ ...aberto, pelotoes: ["  "] }, 0).estado === "em_breve");
t("aberto SEM capacidade → em breve", estadoDaInscricao({ ...aberto, capacidade: null }, 0).estado === "em_breve");
t("coluna capacidade ausente → em breve", estadoDaInscricao({ checkin_status: "aberto", evento_encerrado: false, pelotoes: ["5km"] }, 0).estado === "em_breve");
t("lotado → esgotado", estadoDaInscricao(aberto, 300).estado === "esgotado");
t("capacidade 0 → esgotado", estadoDaInscricao({ ...aberto, capacidade: 0 }, 0).estado === "esgotado");
t("encerrado pela gestão → encerradas", estadoDaInscricao({ ...aberto, checkin_status: "encerrado" }, 0).estado === "encerradas");
t("evento_encerrado → encerradas", estadoDaInscricao({ ...aberto, evento_encerrado: true }, 0).estado === "encerradas");
t("bloqueado antes de receber gente → em breve", estadoDaInscricao({ ...aberto, checkin_status: "bloqueado" }, 0).estado === "em_breve");
t("bloqueado depois de receber gente → encerradas", estadoDaInscricao({ ...aberto, checkin_status: "bloqueado" }, 5).estado === "encerradas");
t("oculto (não liberado) → em breve, mesmo aberto", estadoDaInscricao({ ...aberto, oculto_no_checkin_publico: true }, 0).estado === "em_breve");
t("oculto em evento de teste → segue o estado normal", estadoDaInscricao({ ...aberto, oculto_no_checkin_publico: true }, 0, { teste: true }).estado === "abertas");
t("liberado só sem ocultar", liberado(aberto) && !liberado({ ...aberto, oculto_no_checkin_publico: true }) && !liberado(null));
t("pendências listadas", estadoDaInscricao({ ...aberto, pelotoes: [], capacidade: null }, 0).pendencias.length === 2);

console.log("Pelotões");
t("limpa vazios e espaços", JSON.stringify(pelotoesValidos([" 5km", "", null as unknown as string])) === '["5km"]');
t("rótulo 5km → 5 km", rotuloPelotao("5km") === "5 km");
t("rótulo 2.5km → 2,5 km", rotuloPelotao("2.5km") === "2,5 km");
t("rótulo livre passa como veio", rotuloPelotao("Caminhada") === "Caminhada");

console.log("Formulário");
const base = { nome: "Maria Fernanda Silva", email: "Maria@Exemplo.com ", telefone: "(61) 99812-3456", cpf: "529.982.247-25", sexo: "feminino", pelotao: "5km", aceite_imagem: true };
const r = inscricaoSchema.safeParse(base);
t("dados válidos passam", r.success);
t("CPF sai sem máscara", r.success && r.data.cpf === "52998224725");
t("e-mail normalizado", r.success && r.data.email === "maria@exemplo.com");
t("marketing é opcional e falso por padrão", r.success && r.data.marketing === false);
t("CPF com dígito errado é recusado", !inscricaoSchema.safeParse({ ...base, cpf: "529.982.247-26" }).success);
t("CPF repetido (111...) é recusado", !inscricaoSchema.safeParse({ ...base, cpf: "111.111.111-11" }).success);
t("CPF curto é recusado", !inscricaoSchema.safeParse({ ...base, cpf: "529.982" }).success);
t("nome sem sobrenome é recusado", !inscricaoSchema.safeParse({ ...base, nome: "Maria" }).success);
t("nome com número é recusado", !inscricaoSchema.safeParse({ ...base, nome: "Maria 123 Silva" }).success);
t("e-mail inválido é recusado", !inscricaoSchema.safeParse({ ...base, email: "maria@" }).success);
t("sexo fora da convenção é recusado", !inscricaoSchema.safeParse({ ...base, sexo: "M" }).success);
t("sem pelotão é recusado", !inscricaoSchema.safeParse({ ...base, pelotao: "" }).success);
t("telefone sai só com dígitos", r.success && r.data.telefone === "61998123456");
t("sem telefone é recusado", !inscricaoSchema.safeParse({ ...base, telefone: "" }).success);
t("telefone fixo é recusado", !inscricaoSchema.safeParse({ ...base, telefone: "(61) 3333-4444" }).success);
t("DDD inválido é recusado", !inscricaoSchema.safeParse({ ...base, telefone: "(20) 99812-3456" }).success);
t("máscara do telefone", mascararTelefone("61998123456") === "(61) 99812-3456" && mascararTelefone("619") === "(61) 9");
t("campos faltando são recusados", !inscricaoSchema.safeParse({ cpf: base.cpf }).success);
t("sem aceite de imagem é recusado", !inscricaoSchema.safeParse({ ...base, aceite_imagem: false }).success);
t("aceite ausente é recusado", !inscricaoSchema.safeParse({ ...base, aceite_imagem: undefined }).success);
t("transferência exige o aceite de imagem", !transferenciaSchema.safeParse({ ...base, aceite_imagem: false }).success);
t("Editar da gestão não pede aceite", transferenciaSchema.omit({ marketing: true, aceite_imagem: true }).safeParse({ ...base, aceite_imagem: undefined }).success);
t("recuperação aceita só CPF válido", recuperarSchema.safeParse({ cpf: "52998224725" }).success && !recuperarSchema.safeParse({ cpf: "123" }).success);
t("perfil exige CPF e e-mail", perfilAcessoSchema.safeParse({ cpf: "52998224725", email: "maria@exemplo.com" }).success);
t("perfil recusa e-mail errado", !perfilAcessoSchema.safeParse({ cpf: "52998224725", email: "maria@" }).success);
t("perfil recusa sem e-mail", !perfilAcessoSchema.safeParse({ cpf: "52998224725" }).success);
t("transferência reusa o schema da inscrição", transferenciaSchema.safeParse(base).success);
t("transferência recusa CPF inválido", !transferenciaSchema.safeParse({ ...base, cpf: "111.111.111-11" }).success);

console.log("Prazo de transferência");
t("antes de 07/11 06:30 ainda pode", !prazoTransferenciaPassou(new Date("2026-11-07T06:29:00-03:00")));
t("depois de 07/11 06:30 encerra", prazoTransferenciaPassou(new Date("2026-11-07T06:30:01-03:00")));

console.log("Máscara de CPF");
t("máscara completa", mascararCpf("52998224725") === "529.982.247-25");
t("máscara parcial", mascararCpf("5299") === "529.9");
t("ignora letras e excesso", mascararCpf("529a98224725999") === "529.982.247-25");

console.log("Histórico de transferência");
const hist = parseTransferencias({
  transferencias: [
    { em: "2026-11-01T12:00:00Z", cpf_origem: "529.982.247-25", cpf_destino: "11144477735" },
    { em: "2026-11-02T12:00:00Z", cpf_origem: "11144477735", email_origem: "B@Ex.com", nome_destino: "Ana Souza", email_destino: "ana@ex.com", cpf_destino: "390.533.447-05" },
  ],
});
t("lê duas saídas e normaliza CPF/e-mail", hist.length === 2 && hist[0].cpf_origem === "52998224725" && hist[1].email_origem === "b@ex.com");
t("acha a última saída daquele CPF", transferenciaDestaOrigem(hist, "529.982.247-25")?.cpf_destino === "11144477735");
t("destino usa nome gravado", destinoDaTransferencia(hist[1], { nome: "Outro", email: "x@y.com" }, true).nome === "Ana Souza");
t("destino cai no titular atual se a ficha antiga só tinha CPF", destinoDaTransferencia(hist[0], { nome: "Alex", email: "a@b.com" }, true).nome === "Alex");
t("cpfs anteriores junta o array e o histórico", JSON.stringify(cpfsAnteriores({ cpfs_anteriores: ["52998224725"], transferencias: hist })) === '["52998224725","11144477735"]');
t("e-mails iguais ignoram caixa", emailsIguais(" Ana@Ex.com ", "ana@ex.com") && !emailsIguais("", "") && !emailsIguais("a@b.com", "c@d.com"));

console.log("Sugestão de e-mail");
t("gmaill.com → gmail.com", sugestaoEmail("Ana@Gmaill.com") === "ana@gmail.com");
t("hotmail.con → hotmail.com", sugestaoEmail("joao@hotmail.con") === "joao@hotmail.com");
t(".con genérico → .com", sugestaoEmail("x@empresa.con") === "x@empresa.com");
t("e-mail certo não sugere nada", sugestaoEmail("ana@gmail.com") === null && sugestaoEmail("ana@empresa.com.br") === null);
t("incompleto não sugere", sugestaoEmail("ana@") === null && sugestaoEmail("ana") === null);

console.log(`\n${ok} ok, ${bad} falha(s)`);
process.exit(bad ? 1 : 0);
