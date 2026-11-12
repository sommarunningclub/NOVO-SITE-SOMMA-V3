"use client";

import { useRef, useState, type ReactNode } from "react";
import { deCampoLocal, paraCampoLocal } from "@/lib/evp/formato";
import type { Momento, Profissional } from "@/lib/evp/tipos";
import { Bloco, Campo, Carregando, Mensagem, useApi, useSecao, vazioParaNulo, type Aviso, type EventoAdmin } from "./api";

type Salvar = (bloco: string, dados: Record<string, unknown>) => Promise<void>;
type Estado = { salvando: string; avisos: Record<string, Aviso> };

function Rodape({ bloco, estado, onSalvar }: { bloco: string; estado: Estado; onSalvar: () => void }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" className="mt-botao mt-botao--cheio mt-botao--pequeno" onClick={onSalvar} disabled={estado.salvando !== ""}>
        {estado.salvando === bloco ? "Salvando..." : "Salvar"}
      </button>
      <div className="min-w-0 flex-1"><Mensagem aviso={estado.avisos[bloco] ?? null} /></div>
    </div>
  );
}

const Grade = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

function mover<T>(lista: T[], i: number, passo: -1 | 1): T[] {
  const j = i + passo;
  if (j < 0 || j >= lista.length) return lista;
  const copia = [...lista];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}

function AcoesItem({ i, total, nome, onMover, onRemover }: { i: number; total: number; nome: string; onMover: (p: -1 | 1) => void; onRemover: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => onMover(-1)} disabled={i === 0} aria-label={`Subir ${nome}`}>↑</button>
      <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => onMover(1)} disabled={i === total - 1} aria-label={`Descer ${nome}`}>↓</button>
      <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={onRemover} aria-label={`Remover ${nome}`}>Remover</button>
    </div>
  );
}

/** Envia uma imagem e devolve o endereço público. */
function EnviarImagem({ uso, onPronto, rotulo }: { uso: "hero" | "profissional"; onPronto: (url: string) => void; rotulo: string }) {
  const api = useApi();
  const campo = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Aviso>(null);
  const [enviando, setEnviando] = useState(false);
  return (
    <div>
      <input
        ref={campo}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="mt-so-leitor"
        aria-label={rotulo}
        tabIndex={-1}
        onChange={async (e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = "";
          if (!arquivo) return;
          setEnviando(true);
          setEstado(null);
          const corpo = new FormData();
          corpo.set("arquivo", arquivo);
          corpo.set("uso", uso);
          const r = await api<{ url: string }>("/api/evp/admin/imagem", { method: "POST", body: corpo });
          setEnviando(false);
          if (!r.ok) return setEstado({ tipo: "erro", texto: r.erro });
          onPronto(r.corpo.url);
          setEstado({ tipo: "ok", texto: "Imagem enviada. Salve o bloco para publicar." });
        }}
      />
      <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => campo.current?.click()} disabled={enviando}>
        {enviando ? "Enviando..." : rotulo}
      </button>
      <Mensagem aviso={estado} />
    </div>
  );
}

function Formulario({ ev, salvar, estado }: { ev: EventoAdmin; salvar: Salvar; estado: Estado }) {
  const [id, setId] = useState({ nome: ev.nome, descricao: ev.descricao ?? "" });
  const [onde, setOnde] = useState({
    inicio: paraCampoLocal(ev.starts_at),
    fim: paraCampoLocal(ev.ends_at),
    local_nome: ev.local_nome ?? "",
    endereco: ev.endereco ?? "",
    lat: ev.lat === null ? "" : String(ev.lat),
    lng: ev.lng === null ? "" : String(ev.lng),
    orientacoes_chegada: ev.orientacoes_chegada ?? "",
    info_participacao: ev.info_participacao ?? "",
  });
  const [insc, setInsc] = useState({
    capacidade: ev.capacidade === null ? "" : String(ev.capacidade),
    valor: ev.valor_centavos === null ? "" : (ev.valor_centavos / 100).toFixed(2).replace(".", ","),
    inscricoes_status: ev.inscricoes_status,
    ao_lotar: ev.ao_lotar,
    promover_automatico: ev.promover_automatico,
  });
  const [prog, setProg] = useState<Momento[]>(ev.programacao);
  const [prof, setProf] = useState<Profissional[]>(ev.profissionais);
  const [cont, setCont] = useState({
    hero_imagem: ev.conteudo.hero_imagem ?? "",
    hero_descricao: ev.conteudo.hero_descricao ?? "",
    sobre_texto: ev.conteudo.sobre_texto ?? "",
  });
  const [links, setLinks] = useState({
    link_prova: ev.conteudo.link_prova ?? "",
    link_regulamento: ev.conteudo.link_regulamento ?? "",
    whatsapp: ev.contato.whatsapp ?? "",
    email: ev.contato.email ?? "",
    instagram: ev.contato.instagram ?? "",
  });
  const [local, setLocal] = useState<Record<string, string>>({});

  const numero = (v: string): number | null | "erro" => {
    if (v.trim() === "") return null;
    const n = Number(v.trim().replace(",", "."));
    return Number.isFinite(n) ? n : "erro";
  };

  function salvarOnde() {
    const lat = numero(onde.lat);
    const lng = numero(onde.lng);
    const inicio = onde.inicio ? deCampoLocal(onde.inicio) : null;
    const fim = onde.fim ? deCampoLocal(onde.fim) : null;
    if (lat === "erro" || lng === "erro") return setLocal({ onde: "Latitude e longitude precisam ser números, como -15.7989 e -47.8642." });
    if ((onde.inicio && !inicio) || (onde.fim && !fim)) return setLocal({ onde: "Confira a data e o horário." });
    setLocal({});
    void salvar("onde", {
      starts_at: inicio,
      ends_at: fim,
      local_nome: vazioParaNulo(onde.local_nome),
      endereco: vazioParaNulo(onde.endereco),
      lat,
      lng,
      orientacoes_chegada: vazioParaNulo(onde.orientacoes_chegada),
      info_participacao: vazioParaNulo(onde.info_participacao),
    });
  }

  function salvarInscricoes() {
    const cap = numero(insc.capacidade);
    const valor = numero(insc.valor);
    if (cap === "erro" || (cap !== null && (!Number.isInteger(cap) || cap < 0))) return setLocal({ inscricoes: "A capacidade precisa ser um número inteiro." });
    if (valor === "erro" || (valor !== null && valor < 0)) return setLocal({ inscricoes: "Confira o valor da inscrição." });
    setLocal({});
    void salvar("inscricoes", {
      capacidade: cap,
      valor_centavos: valor === null ? null : Math.round(valor * 100),
      inscricoes_status: insc.inscricoes_status,
      ao_lotar: insc.ao_lotar,
      promover_automatico: insc.promover_automatico,
    });
  }

  const erroLocal = (b: string) => (local[b] ? <p className="mt-erro" role="alert">{local[b]}</p> : null);
  const v = ev.vagas;

  return (
    <div className="grid gap-5">
      <Bloco titulo="Identificação">
        <div className="grid gap-4">
          <Campo rotulo="Nome do evento">
            <input className="mt-input" value={id.nome} maxLength={160} onChange={(e) => setId({ ...id, nome: e.target.value })} />
          </Campo>
          <Campo rotulo="Descrição" dica="Usada nos buscadores e no compartilhamento do link.">
            <textarea className="mt-input" rows={3} maxLength={600} value={id.descricao} onChange={(e) => setId({ ...id, descricao: e.target.value })} />
          </Campo>
        </div>
        <Rodape bloco="identificacao" estado={estado} onSalvar={() => void salvar("identificacao", { nome: id.nome.trim(), descricao: vazioParaNulo(id.descricao) })} />
      </Bloco>

      <Bloco titulo="Quando e onde" descricao="Enquanto um campo estiver vazio, a página mostra “em definição” no lugar. Horários em hora de Brasília.">
        <Grade>
          <Campo rotulo="Início">
            <input className="mt-input" type="datetime-local" value={onde.inicio} onChange={(e) => setOnde({ ...onde, inicio: e.target.value })} />
          </Campo>
          <Campo rotulo="Término (opcional)">
            <input className="mt-input" type="datetime-local" value={onde.fim} onChange={(e) => setOnde({ ...onde, fim: e.target.value })} />
          </Campo>
          <Campo rotulo="Local">
            <input className="mt-input" value={onde.local_nome} maxLength={160} onChange={(e) => setOnde({ ...onde, local_nome: e.target.value })} />
          </Campo>
          <Campo rotulo="Endereço">
            <input className="mt-input" value={onde.endereco} maxLength={300} onChange={(e) => setOnde({ ...onde, endereco: e.target.value })} />
          </Campo>
          <Campo rotulo="Latitude" dica="Com as coordenadas, a página mostra o mapa do local.">
            <input className="mt-input" inputMode="decimal" placeholder="-15.7989" value={onde.lat} onChange={(e) => setOnde({ ...onde, lat: e.target.value })} />
          </Campo>
          <Campo rotulo="Longitude">
            <input className="mt-input" inputMode="decimal" placeholder="-47.8642" value={onde.lng} onChange={(e) => setOnde({ ...onde, lng: e.target.value })} />
          </Campo>
          <Campo rotulo="Orientações de chegada" className="sm:col-span-2">
            <textarea className="mt-input" rows={3} maxLength={1200} value={onde.orientacoes_chegada} onChange={(e) => setOnde({ ...onde, orientacoes_chegada: e.target.value })} />
          </Campo>
          <Campo rotulo="Informações de participação" className="sm:col-span-2">
            <textarea className="mt-input" rows={3} maxLength={1200} value={onde.info_participacao} onChange={(e) => setOnde({ ...onde, info_participacao: e.target.value })} />
          </Campo>
        </Grade>
        {erroLocal("onde")}
        <Rodape bloco="onde" estado={estado} onSalvar={salvarOnde} />
      </Bloco>

      <Bloco
        titulo="Inscrições"
        descricao={`Hoje: ${v.confirmadas} confirmada(s), ${v.fila} na lista de espera${v.capacidade === null ? ", capacidade não definida" : `, ${v.vagas_livres} vaga(s) livre(s) de ${v.capacidade}`}. Abrir exige data, local, endereço, capacidade e valor definidos.`}
      >
        <Grade>
          <Campo rotulo="Capacidade (vagas)">
            <input className="mt-input" inputMode="numeric" value={insc.capacidade} onChange={(e) => setInsc({ ...insc, capacidade: e.target.value.replace(/\D/g, "") })} />
          </Campo>
          <Campo rotulo="Valor da inscrição (R$)" dica="Use 0 para gratuito. Vazio significa ainda não definido. O site não cobra online.">
            <input className="mt-input" inputMode="decimal" placeholder="0,00" value={insc.valor} onChange={(e) => setInsc({ ...insc, valor: e.target.value })} />
          </Campo>
          <Campo rotulo="Status das inscrições">
            <select className="mt-input" value={insc.inscricoes_status} onChange={(e) => setInsc({ ...insc, inscricoes_status: e.target.value as EventoAdmin["inscricoes_status"] })}>
              <option value="em_breve">Em breve (formulário fechado)</option>
              <option value="aberta">Abertas</option>
              <option value="encerrada">Encerradas</option>
            </select>
          </Campo>
          <Campo rotulo="Quando as vagas acabarem">
            <select className="mt-input" value={insc.ao_lotar} onChange={(e) => setInsc({ ...insc, ao_lotar: e.target.value as EventoAdmin["ao_lotar"] })}>
              <option value="lista_espera">Abrir lista de espera</option>
              <option value="encerrar">Encerrar (mostrar esgotado)</option>
            </select>
          </Campo>
          <label className="mt-check sm:col-span-2">
            <input type="checkbox" checked={insc.promover_automatico} onChange={(e) => setInsc({ ...insc, promover_automatico: e.target.checked })} />
            <span>Vaga liberada vai sozinha para a primeira pessoa da lista de espera, com aviso por e-mail</span>
          </label>
        </Grade>
        {erroLocal("inscricoes")}
        <Rodape bloco="inscricoes" estado={estado} onSalvar={salvarInscricoes} />
      </Bloco>

      <Bloco titulo="Programação" descricao="O horário é opcional: só aparece na página quando preenchido.">
        <ol className="grid gap-4">
          {prog.map((m, i) => (
            <li key={i} className="rounded-xl border p-4" style={{ borderColor: "var(--mt-linha)" }}>
              <p className="mt-rotulo mb-3">Momento {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                <Campo rotulo="Título">
                  <input className="mt-input" value={m.titulo} maxLength={160} onChange={(e) => setProg(prog.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))} />
                </Campo>
                <Campo rotulo="Horário">
                  <input className="mt-input" placeholder="19h30" value={m.horario ?? ""} maxLength={40} onChange={(e) => setProg(prog.map((x, j) => (j === i ? { ...x, horario: e.target.value } : x)))} />
                </Campo>
                <Campo rotulo="Descrição" className="sm:col-span-2">
                  <textarea className="mt-input" rows={2} maxLength={500} value={m.descricao ?? ""} onChange={(e) => setProg(prog.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))} />
                </Campo>
              </div>
              <div className="mt-3">
                <AcoesItem i={i} total={prog.length} nome={`momento ${i + 1}`} onMover={(p) => setProg(mover(prog, i, p))} onRemover={() => setProg(prog.filter((_, j) => j !== i))} />
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno mt-4" onClick={() => setProg([...prog, { titulo: "", descricao: null, horario: null }])} disabled={prog.length >= 20}>
          Adicionar momento
        </button>
        <Rodape
          bloco="programacao"
          estado={estado}
          onSalvar={() =>
            void salvar("programacao", {
              programacao: prog.filter((m) => m.titulo.trim()).map((m) => ({ titulo: m.titulo.trim(), descricao: vazioParaNulo(m.descricao ?? ""), horario: vazioParaNulo(m.horario ?? "") })),
            })
          }
        />
      </Bloco>

      <Bloco titulo="Profissionais">
        <p className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--mt-laranja)", background: "rgba(255,44,3,0.08)" }}>
          Não invente credenciais: publique só o que a pessoa confirmou.
        </p>
        <ol className="grid gap-4">
          {prof.map((p, i) => {
            const set = (campo: Partial<Profissional>) => setProf(prof.map((x, j) => (j === i ? { ...x, ...campo } : x)));
            return (
              <li key={i} className="rounded-xl border p-4" style={{ borderColor: "var(--mt-linha)" }}>
                <p className="mt-rotulo mb-3">Profissional {i + 1}</p>
                <Grade>
                  <Campo rotulo="Nome"><input className="mt-input" value={p.nome} maxLength={120} onChange={(e) => set({ nome: e.target.value })} /></Campo>
                  <Campo rotulo="Cargo ou função"><input className="mt-input" value={p.funcao ?? ""} maxLength={120} onChange={(e) => set({ funcao: e.target.value })} /></Campo>
                  <Campo rotulo="Organização">
                    <select className="mt-input" value={p.organizacao} onChange={(e) => set({ organizacao: e.target.value as Profissional["organizacao"] })}>
                      <option value="bora">BORA Assessoria</option>
                      <option value="somma">SOMMA Club</option>
                    </select>
                  </Campo>
                  <Campo rotulo="Especialidade ou experiência"><input className="mt-input" value={p.especialidade ?? ""} maxLength={200} onChange={(e) => set({ especialidade: e.target.value })} /></Campo>
                  <Campo rotulo="Breve descrição" className="sm:col-span-2">
                    <textarea className="mt-input" rows={3} maxLength={600} value={p.descricao ?? ""} onChange={(e) => set({ descricao: e.target.value })} />
                  </Campo>
                  <Campo rotulo="Foto (endereço)" dica="Cole um endereço https:// ou envie um arquivo." className="sm:col-span-2">
                    <input className="mt-input" inputMode="url" value={p.foto_url ?? ""} maxLength={600} onChange={(e) => set({ foto_url: e.target.value })} />
                  </Campo>
                </Grade>
                <div className="mt-3 flex flex-wrap items-start gap-4">
                  {p.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.foto_url} alt={`Foto de ${p.nome || "profissional"}`} className="h-20 w-20 rounded-xl object-cover" />
                  ) : null}
                  <EnviarImagem uso="profissional" rotulo="Enviar foto" onPronto={(url) => set({ foto_url: url })} />
                </div>
                <div className="mt-3">
                  <AcoesItem i={i} total={prof.length} nome={p.nome || `profissional ${i + 1}`} onMover={(d) => setProf(mover(prof, i, d))} onRemover={() => setProf(prof.filter((_, j) => j !== i))} />
                </div>
              </li>
            );
          })}
        </ol>
        {prof.length === 0 ? <p className="text-sm" style={{ color: "var(--mt-cinza)" }}>Nenhum profissional cadastrado. A página mostra a seção sem os cartões.</p> : null}
        <button
          type="button"
          className="mt-botao mt-botao--linha mt-botao--pequeno mt-4"
          disabled={prof.length >= 20}
          onClick={() => setProf([...prof, { nome: "", funcao: null, descricao: null, especialidade: null, foto_url: null, organizacao: "bora" }])}
        >
          Adicionar profissional
        </button>
        <Rodape
          bloco="profissionais"
          estado={estado}
          onSalvar={() =>
            void salvar("profissionais", {
              profissionais: prof.filter((p) => p.nome.trim()).map((p) => ({
                nome: p.nome.trim(),
                funcao: vazioParaNulo(p.funcao ?? ""),
                descricao: vazioParaNulo(p.descricao ?? ""),
                especialidade: vazioParaNulo(p.especialidade ?? ""),
                foto_url: vazioParaNulo(p.foto_url ?? ""),
                organizacao: p.organizacao,
              })),
            })
          }
        />
      </Bloco>

      <Bloco titulo="Textos e imagens" descricao="Vazio usa o texto e a imagem padrão da página.">
        <div className="grid gap-4">
          <Campo rotulo="Imagem da abertura (endereço)" dica="Use foto real do SOMMA ou registro autorizado. Confira se não há criança em destaque.">
            <input className="mt-input" inputMode="url" value={cont.hero_imagem} maxLength={600} onChange={(e) => setCont({ ...cont, hero_imagem: e.target.value })} />
          </Campo>
          <div className="flex flex-wrap items-start gap-4">
            {cont.hero_imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cont.hero_imagem} alt="Imagem atual da abertura" className="h-28 w-20 rounded-xl object-cover" />
            ) : null}
            <EnviarImagem uso="hero" rotulo="Enviar imagem" onPronto={(url) => setCont({ ...cont, hero_imagem: url })} />
          </div>
          <Campo rotulo="Texto de abertura">
            <textarea className="mt-input" rows={3} maxLength={500} value={cont.hero_descricao} onChange={(e) => setCont({ ...cont, hero_descricao: e.target.value })} />
          </Campo>
          <Campo rotulo="Texto de “O que é o Meeting Técnico”">
            <textarea className="mt-input" rows={5} maxLength={1500} value={cont.sobre_texto} onChange={(e) => setCont({ ...cont, sobre_texto: e.target.value })} />
          </Campo>
        </div>
        <Rodape bloco="conteudo" estado={estado} onSalvar={() => void salvar("conteudo", { conteudo: { ...cont, link_prova: links.link_prova, link_regulamento: links.link_regulamento } })} />
      </Bloco>

      <Bloco titulo="Links e contato">
        <Grade>
          <Campo rotulo="Link da prova"><input className="mt-input" inputMode="url" placeholder="https://" value={links.link_prova} maxLength={600} onChange={(e) => setLinks({ ...links, link_prova: e.target.value })} /></Campo>
          <Campo rotulo="Link do regulamento"><input className="mt-input" inputMode="url" placeholder="https://" value={links.link_regulamento} maxLength={600} onChange={(e) => setLinks({ ...links, link_regulamento: e.target.value })} /></Campo>
          <Campo rotulo="WhatsApp de contato"><input className="mt-input" inputMode="tel" value={links.whatsapp} maxLength={40} onChange={(e) => setLinks({ ...links, whatsapp: e.target.value })} /></Campo>
          <Campo rotulo="E-mail de contato"><input className="mt-input" type="email" inputMode="email" value={links.email} maxLength={160} onChange={(e) => setLinks({ ...links, email: e.target.value })} /></Campo>
          <Campo rotulo="Instagram"><input className="mt-input" placeholder="@somma.club" value={links.instagram} maxLength={120} onChange={(e) => setLinks({ ...links, instagram: e.target.value })} /></Campo>
        </Grade>
        <Rodape
          bloco="links"
          estado={estado}
          onSalvar={() =>
            void salvar("links", {
              conteudo: { ...cont, link_prova: links.link_prova, link_regulamento: links.link_regulamento },
              contato: { whatsapp: links.whatsapp, email: links.email, instagram: links.instagram },
            })
          }
        />
      </Bloco>
    </div>
  );
}

export function AbaEvento() {
  const api = useApi();
  const { dados, erro, carregando, recarregar } = useSecao<EventoAdmin>("evento");
  const [estado, setEstado] = useState<Estado>({ salvando: "", avisos: {} });

  const salvar: Salvar = async (bloco, corpo) => {
    setEstado((e) => ({ salvando: bloco, avisos: { ...e.avisos, [bloco]: null } }));
    const r = await api<{ promovidas?: number; avisados?: number }>("/api/evp/admin/evento", { method: "PUT", body: JSON.stringify(corpo) });
    let aviso: Aviso;
    if (r.ok) {
      const n = r.corpo.promovidas ?? 0;
      aviso = { tipo: "ok", texto: n ? `Salvo. ${n} pessoa(s) saíram da lista de espera, ${r.corpo.avisados ?? 0} avisada(s) por e-mail.` : "Salvo." };
    } else aviso = { tipo: "erro", texto: r.erro };
    setEstado((e) => ({ salvando: "", avisos: { ...e.avisos, [bloco]: aviso } }));
  };

  if (!dados) return <Carregando erro={erro} carregando={carregando} tentar={recarregar} />;
  return <Formulario ev={dados} salvar={salvar} estado={estado} />;
}
