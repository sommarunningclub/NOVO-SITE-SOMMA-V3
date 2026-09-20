import type { Metadata } from "next";
import { getServiceSupabase } from "@/lib/supabase";
import { parceiroAtual } from "@/lib/parceiro/auth";
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
 * que está aberto.
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
    .select("id, titulo, data_evento, local, horario_inicio")
    .eq("checkin_status", "aberto")
    .order("data_evento", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!evento) return null;

  const { count } = await supabase
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("evento_id", evento.id);

  return {
    titulo: String(evento.titulo ?? "Evento SOMMA Club"),
    dataEvento: evento.data_evento ? String(evento.data_evento) : null,
    horario: evento.horario_inicio ? String(evento.horario_inicio).slice(0, 5) : null,
    local: evento.local ? String(evento.local) : null,
    inscritos: count ?? 0,
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
