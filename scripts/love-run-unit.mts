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
import { inscricaoSchema, mascararCpf, recuperarSchema, sugestaoEmail } from "../lib/dexcomplica-love-run/schema";

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
const base = { nome: "Maria Fernanda Silva", email: "Maria@Exemplo.com ", cpf: "529.982.247-25", sexo: "feminino", pelotao: "5km" };
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
t("campos faltando são recusados", !inscricaoSchema.safeParse({ cpf: base.cpf }).success);
t("recuperação aceita só CPF válido", recuperarSchema.safeParse({ cpf: "52998224725" }).success && !recuperarSchema.safeParse({ cpf: "123" }).success);

console.log("Máscara de CPF");
t("máscara completa", mascararCpf("52998224725") === "529.982.247-25");
t("máscara parcial", mascararCpf("5299") === "529.9");
t("ignora letras e excesso", mascararCpf("529a98224725999") === "529.982.247-25");

console.log("Sugestão de e-mail");
t("gmaill.com → gmail.com", sugestaoEmail("Ana@Gmaill.com") === "ana@gmail.com");
t("hotmail.con → hotmail.com", sugestaoEmail("joao@hotmail.con") === "joao@hotmail.com");
t(".con genérico → .com", sugestaoEmail("x@empresa.con") === "x@empresa.com");
t("e-mail certo não sugere nada", sugestaoEmail("ana@gmail.com") === null && sugestaoEmail("ana@empresa.com.br") === null);
t("incompleto não sugere", sugestaoEmail("ana@") === null && sugestaoEmail("ana") === null);

console.log(`\n${ok} ok, ${bad} falha(s)`);
process.exit(bad ? 1 : 0);
