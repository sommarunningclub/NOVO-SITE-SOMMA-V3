"use client";

import { useState } from "react";
import { MENSAGENS, OPCOES_GRUPO, mensagemDeErro, normalizarInstagram } from "@/lib/vem-correr-comigo/regras";
import { mascararTelefone } from "@/lib/dexcomplica-love-run/schema";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";
import type { MeuPerfil } from "@/lib/vem-correr-comigo/tipos";
import { enviarJson, pedir, rotuloKm, urlFoto } from "./api";
import FotoPerfil from "./FotoPerfil";

type Props = {
  /** Sem perfil = onboarding. */
  perfil: MeuPerfil | null;
  inscricao?: { nome: string; pelotao: string | null; precisa_genero: boolean };
  onSalvo: (criado: boolean) => void;
  onCancelar?: () => void;
};

export default function FormPerfil({ perfil, inscricao, onSalvo, onCancelar }: Props) {
  const novo = !perfil;
  const [foto, setFoto] = useState<Blob | null>(null);
  const [instagram, setInstagram] = useState(perfil?.instagram ? `@${perfil.instagram}` : "");
  const [whatsapp, setWhatsapp] = useState(perfil?.whatsapp ? mascararTelefone(perfil.whatsapp) : "");
  const [publico, setPublico] = useState(perfil?.whatsapp_publico ?? false);
  const [preferencia, setPreferencia] = useState<number | null>(perfil?.preferencia ?? null);
  const [genero, setGenero] = useState("");
  const [termos, setTermos] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const nome = perfil?.nome ?? inscricao?.nome ?? "";
  const pelotao = perfil?.pelotao ?? inscricao?.pelotao ?? null;
  const pedirGenero = novo && inscricao?.precisa_genero;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!preferencia) return setErro("Escolha como você quer descomplicar.");
    if (pedirGenero && !genero) return setErro("Precisamos dessa informação para montar os grupos.");
    if (novo && !termos) return setErro("Confirme que entendeu o que fica visível.");
    setErro("");
    setEnviando(true);
    try {
      const r = await enviarJson<{ ok: boolean; erro?: string; mensagem?: string; criado?: boolean }>(
        "/perfil",
        { preferencia, instagram, whatsapp, whatsapp_publico: publico, genero: genero || undefined, termos },
        "PUT"
      );
      if (!r.ok) return setErro(r.mensagem ?? mensagemDeErro(r.erro));
      if (foto) {
        const dados = new FormData();
        dados.append("foto", foto, "foto.jpg");
        const f = await pedir<{ ok: boolean }>("/foto", { method: "POST", body: dados }).catch(() => ({ ok: false }));
        if (!f.ok) setErro("Seu perfil foi salvo, mas a foto não subiu. Tente de novo em Editar perfil.");
      }
      rastrearCorre(r.criado ? "profile_created" : "profile_updated", { tamanho: preferencia, com_foto: Boolean(foto) });
      onSalvo(Boolean(r.criado));
    } catch {
      setErro(MENSAGENS.rede);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cr-form cr-perfil" onSubmit={salvar} noValidate>
      {novo ? (
        <>
          <p className="lr-eyebrow lr-eyebrow--claro">Seu perfil</p>
          <h1 className="cr-titulo">Oi, {nome.split(" ")[0]}!</h1>
        </>
      ) : (
        <h2 className="cr-h2">Editar perfil</h2>
      )}
      <p className="cr-resumo">
        <strong>{nome}</strong> · {rotuloKm(pelotao)} <small>(vem da sua inscrição)</small>
      </p>

      <FotoPerfil atual={perfil?.foto != null ? urlFoto(perfil.codigo, perfil.foto) : null} onPronta={setFoto} />

      <label className="cr-campo">
        <span>Qual é seu Instagram?</span>
        <input
          className="cr-input"
          placeholder="@seuusuario"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          onBlur={() => { const n = normalizarInstagram(instagram); setInstagram(n ? `@${n}` : ""); }}
        />
        <small>Opcional. Se preencher, fica visível para as outras pessoas inscritas.</small>
      </label>

      <label className="cr-campo">
        <span>Quer compartilhar seu WhatsApp?</span>
        <input
          className="cr-input"
          type="tel"
          inputMode="tel"
          placeholder="(61) 99999-9999"
          maxLength={15}
          value={whatsapp}
          onChange={(e) => { const v = mascararTelefone(e.target.value); setWhatsapp(v); if (!v) setPublico(false); }}
        />
      </label>
      <label className={`cr-chave${whatsapp ? "" : " cr-chave--off"}`}>
        <input type="checkbox" checked={publico} disabled={!whatsapp} onChange={(e) => setPublico(e.target.checked)} />
        <span>Deixar meu WhatsApp visível para outros participantes</span>
      </label>

      {pedirGenero ? (
        <fieldset className="cr-campo">
          <legend>Como você se identifica para a formação dos grupos?</legend>
          <small>Usamos só para a regra de até 2 homens e 2 mulheres por grupo. Não aparece no seu perfil.</small>
          <div className="cr-opcoes">
            {[["feminino", "Mulher"], ["masculino", "Homem"], ["outro", "Outra identidade ou prefiro não dizer"]].map(([v, r]) => (
              <button type="button" key={v} className={`cr-opcao${genero === v ? " is-on" : ""}`} aria-pressed={genero === v} onClick={() => setGenero(v)}>{r}</button>
            ))}
          </div>
          {genero === "outro" ? <small>Você entra em duplas e trios. Quartetos seguem a regra de 2 homens e 2 mulheres definida pela organização.</small> : null}
        </fieldset>
      ) : null}

      <fieldset className="cr-campo">
        <legend>Como você quer descomplicar?</legend>
        <div className="cr-grupos">
          {OPCOES_GRUPO.map((o) => (
            <button type="button" key={o.valor} className={`cr-escolha${preferencia === o.valor ? " is-on" : ""}`} aria-pressed={preferencia === o.valor} onClick={() => setPreferencia(o.valor)}>
              <strong>{o.nome}</strong>
              <span>{o.frase}</span>
              <small>{o.detalhe}</small>
            </button>
          ))}
        </div>
        <small>É o tamanho máximo que você aceita, não uma obrigação de completar o grupo.</small>
      </fieldset>

      {novo ? (
        <div className="cr-aviso">
          <p><strong>Seu perfil ficará visível para outras pessoas inscritas no Dexcomplica.</strong></p>
          <p>Elas veem sua foto, nome, distância, como quer descomplicar e seu Instagram, se informar. O WhatsApp só aparece se você ligar a opção acima.</p>
          <label className="cr-chave">
            <input type="checkbox" checked={termos} onChange={(e) => setTermos(e.target.checked)} />
            <span>Entendi e quero publicar meu perfil.</span>
          </label>
        </div>
      ) : null}

      {erro ? <p className="cr-erro" role="alert">{erro}</p> : null}
      <button className="lr-btn lr-btn--vermelho lr-btn--bloco" disabled={enviando}>
        {enviando ? "Salvando…" : novo ? "Criar meu perfil e descomplicar" : "Salvar"}
      </button>
      {onCancelar ? <button type="button" className="cr-link" onClick={onCancelar}>Cancelar</button> : null}
    </form>
  );
}
