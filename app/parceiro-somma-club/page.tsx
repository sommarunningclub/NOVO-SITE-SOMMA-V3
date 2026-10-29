import type { Metadata } from "next";
import { getServiceSupabase } from "@/lib/supabase";
import { parceiroAtual } from "@/lib/parceiro/auth";
import { resumirInscricoes, type LinhaInscricao } from "@/lib/parceiro/estatisticas";
import { Gate } from "./_gate";
import { Painel, type EventoAberto } from "./_painel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acesso exclusivo · Parceiro Somma Club",
  description: "Acompanhe as inscrições do check-in aberto do SOMMA Club.",
  robots: { index: false, follow: false },
};

/**
 * Acesso exclusivo do parceiro: quantas pessoas já se inscreveram no check-in
 * que está aberto, o ritmo das inscrições, sexo e pelotões. Só contagens: o
 * nome, o CPF e o contato de ninguém saem do servidor.
 *
 * O número é lido no servidor e só depois de o cookie assinado estar válido —
 * quem não passou pelo código não recebe nem o dado nem a estrutura da página.
 */
async function buscarEventoAberto(): Promise<EventoAberto | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  // Mesmo critério do painel interno (app/api/insider/checkins): entre os
  // eventos com check-in aberto, o mais recente. Assim o parceiro e o time
  // olham sempre para o mesmo evento.
  const { data: evento } = await supabase
    .from("eventos")
    .select("id, titulo, data_evento, local, horario_inicio, pelotoes")
    .eq("checkin_status", "aberto")
    .order("data_evento", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!evento) return null;

  // Só as três colunas que viram contagem, em páginas de 1000 (limite do PostgREST).
  const linhas: LinhaInscricao[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from("checkins")
      .select("data_hora_checkin, sexo, pelotao")
      .eq("evento_id", evento.id)
      .order("id")
      .range(de, de + 999);
    if (error || !data) break;
    linhas.push(...(data as LinhaInscricao[]));
    if (data.length < 1000) break;
  }

  const pelotoes = Array.isArray(evento.pelotoes) ? evento.pelotoes.map(String) : [];

  return {
    titulo: String(evento.titulo ?? "Evento SOMMA Club"),
    dataEvento: evento.data_evento ? String(evento.data_evento) : null,
    horario: evento.horario_inicio ? String(evento.horario_inicio).slice(0, 5) : null,
    local: evento.local ? String(evento.local) : null,
    inscritos: linhas.length,
    resumo: resumirInscricoes(linhas, pelotoes),
  };
}

export default async function ParceiroSommaClubPage() {
  const parceiro = await parceiroAtual();
  if (!parceiro) return <Gate />;

  const evento = await buscarEventoAberto();

  return (
    <Painel
      parceiro={parceiro.nome}
      evento={evento}
      atualizadoEm={new Date().toISOString()}
    />
  );
}
