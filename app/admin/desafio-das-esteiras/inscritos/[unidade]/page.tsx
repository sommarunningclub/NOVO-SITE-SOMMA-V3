import { notFound } from "next/navigation";
import {
  getOperatorSession,
  unitAuthConfigured,
  unitPasswordEnv,
} from "@/lib/desafio-esteiras/auth";
import { getUnit } from "@/lib/desafio-esteiras/event.config";
import { LoginUnidade } from "../../_components/LoginUnidade";
import { PainelUnidade } from "../../_components/PainelUnidade";

export const dynamic = "force-dynamic";

/**
 * Página da operação de UMA unidade.
 *
 * Quem diz a unidade é a URL, não a senha: `/inscritos/samambaia` abre a
 * Samambaia. Isso é o que permite uma senha só para as quatro, e é por isso
 * que este acesso não edita cadastro — só acompanha e valida ticket.
 *
 * Uma sessão de outra unidade abre aqui a página da unidade dela, não esta:
 * o painel usa o escopo da sessão, e a API filtra por ele de novo. A URL
 * escolhe onde entrar; ela não concede acesso sozinha.
 */
export default async function UnidadePage({
  params,
}: {
  params: Promise<{ unidade: string }>;
}) {
  const { unidade } = await params;
  const unit = getUnit(unidade);
  if (!unit) notFound();

  const session = await getOperatorSession();

  if (!session) {
    return (
      <LoginUnidade
        unidade={{ id: unit.id, nome: unit.nome, curto: unit.curto, cidade: unit.cidade, uf: unit.uf }}
        configurado={unitAuthConfigured(unit.id)}
        envSugerida={unitPasswordEnv(unit.id)}
      />
    );
  }

  return <PainelUnidade session={session} unidadeDaUrl={unit.id} />;
}
