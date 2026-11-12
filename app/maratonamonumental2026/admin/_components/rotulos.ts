/** Nomes legíveis para as ações gravadas em evp_audit_logs. */

const ACOES: Record<string, string> = {
  inscricao_confirmada: "Inscrição confirmada",
  lista_espera_entrada: "Entrou na lista de espera",
  lista_espera_promovida: "Saiu da lista de espera e ganhou a vaga",
  inscricao_editada: "Dados da inscrição editados",
  inscricao_cancelada: "Inscrição cancelada",
  checkin: "Check-in feito",
  checkin_recusado: "Check-in recusado",
  checkin_desfeito: "Check-in desfeito",
  cpf_revelado: "CPF inteiro visualizado",
  confirmacao_reenviada: "Confirmação reenviada por e-mail",
  participantes_exportados: "Lista de participantes exportada (CSV)",
  evento_editado: "Configuração do evento alterada",
  percurso_enviado: "Arquivo de percurso enviado",
  percurso_publicar: "Percurso publicado",
  percurso_despublicar: "Percurso retirado da página",
  percurso_remover: "Percurso removido",
  equipe_criada: "Conta da equipe criada",
  equipe_editada: "Conta da equipe alterada",
  imagem_enviada: "Imagem enviada",
};

const RECUSA: Record<string, string> = {
  invalido: "QR Code inválido",
  duplicado: "já tinha check-in",
  cancelada: "inscrição cancelada",
  lista_espera: "pessoa em lista de espera",
};

const CAMPOS: Record<string, string> = {
  nome: "nome", email: "e-mail", telefone: "WhatsApp", sexo: "sexo", distancia: "distância", primeira_vez: "primeira vez",
};

export function rotuloAcao(acao: string, detalhes: Record<string, unknown> = {}): string {
  const base = ACOES[acao] ?? acao.replace(/_/g, " ");
  const extras: string[] = [];
  if (acao === "checkin_recusado" && typeof detalhes.motivo === "string") extras.push(RECUSA[detalhes.motivo] ?? detalhes.motivo);
  if (acao === "checkin" && typeof detalhes.via === "string") extras.push(detalhes.via === "qr" ? "QR Code" : "busca manual");
  if (acao === "inscricao_editada" && Array.isArray(detalhes.campos)) {
    extras.push(detalhes.campos.map((c) => CAMPOS[String(c)] ?? String(c)).join(", "));
  }
  if (acao === "inscricao_cancelada" && typeof detalhes.motivo === "string" && detalhes.motivo) extras.push(detalhes.motivo);
  if (acao === "participantes_exportados" && typeof detalhes.linhas === "number") extras.push(`${detalhes.linhas} linhas`);
  if (acao === "evento_editado" && Array.isArray(detalhes.campos)) extras.push(detalhes.campos.map(String).join(", "));
  if (acao === "percurso_enviado" && typeof detalhes.arquivo === "string") extras.push(detalhes.arquivo);
  if ((acao === "equipe_criada" || acao === "equipe_editada") && typeof detalhes.nome === "string") extras.push(detalhes.nome);
  if (acao === "confirmacao_reenviada" && detalhes.enviado === false) extras.push("o e-mail não saiu");
  return extras.length ? `${base}: ${extras.join(" · ")}` : base;
}

const ALVOS: Record<string, string> = { inscricao: "Inscrição", evento: "Evento", percurso: "Percurso", equipe: "Equipe" };
export const rotuloAlvo = (tipo: string | null) => (tipo ? ALVOS[tipo] ?? tipo : "");
