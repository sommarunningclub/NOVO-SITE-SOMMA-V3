"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatCPF } from "@/lib/cpf";
import { maskPhone } from "@/lib/validation";
import { FORMATO, LINKS } from "@/lib/o-longao/config";
import type { Categoria } from "@/lib/o-longao/config";
import { CATEGORIAS_INSCRICAO, type CategoriaInscricao } from "@/lib/o-longao/schema";
import { nomeDigitando } from "@/lib/o-longao/nome";
import { readAttribution, track } from "@/lib/o-longao/analytics";
import { Campo, BlocoTitulo, Aceite } from "./Campos";
import { AtletaCard } from "./AtletaCard";
import { Revisao } from "./Revisao";
import { Confirmada } from "./Confirmada";
import {
  atletaVazio,
  categoriasAtivas,
  ETAPAS,
  normalizarRascunho,
  RASCUNHO_KEY,
  ROTULO_CATEGORIA,
  valoresIniciais,
  type AtletaForm,
  type FormValues,
} from "./tipos";
import { contarCompletos, etapaDoCampo, validarEtapa, type Erros } from "./validacao";

const LOGO_MAX_BYTES = 3 * 1024 * 1024;

const ROTULO_ESCOLHA: Record<CategoriaInscricao, { titulo: string; texto: string }> = {
  masculino: { titulo: "MASCULINO", texto: "Uma equipe de 8 atletas na categoria masculina." },
  feminino: { titulo: "FEMININO", texto: "Uma equipe de 8 atletas na categoria feminina." },
  ambas: { titulo: "AMBAS", texto: "Duas equipes, 16 atletas no total, atletas diferentes." },
};

/**
 * Inscrição da crew, em seis etapas.
 *
 * O estado é um objeto único (`FormValues`) em vez de formulário controlado por
 * biblioteca: são até 16 atletas com nove campos cada, e a única coisa que
 * realmente importa aqui é que o rascunho sobreviva a um fechar de aba. Cada
 * etapa valida com as peças do mesmo zod que o servidor usa (ver validacao.ts),
 * então não existe regra de validação que viva só no cliente.
 *
 * O rascunho vai para o localStorage com atraso, e nunca inclui o arquivo da
 * logo. Ao voltar, a pessoa escolhe se continua ou recomeça: retomar sozinho
 * seria assustador para quem só queria olhar o formulário de novo.
 */
export function Wizard() {
  const [valores, setValores] = useState<FormValues>(valoresIniciais);
  const [etapa, setEtapa] = useState(1);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [temRascunho, setTemRascunho] = useState(false);
  const [abaCategoria, setAbaCategoria] = useState<Categoria>("masculino");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [resultado, setResultado] = useState<{
    crew: string;
    codigo: string;
    categorias: Categoria[];
  } | null>(null);

  const honeypot = useRef<HTMLInputElement>(null);
  const topo = useRef<HTMLDivElement>(null);
  const jaContou = useRef(false);
  const restaurando = useRef(false);
  /** Trava do autosave enquanto o destino do rascunho não está decidido. */
  const podeSalvar = useRef(false);

  const categorias = categoriasAtivas(valores.crew.categoria);

  // ── Rascunho ──────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(RASCUNHO_KEY);
      if (bruto) {
        // Existe rascunho: o autosave fica travado até a pessoa decidir o que
        // fazer com ele. Sem essa trava, o efeito abaixo dispararia na montagem
        // com o formulário vazio e gravaria por cima do rascunho em 600ms,
        // fazendo o CONTINUAR restaurar uma tela em branco.
        setTemRascunho(true);
        return;
      }
    } catch {
      /* modo privado */
    }
    podeSalvar.current = true;
  }, []);

  useEffect(() => {
    if (!podeSalvar.current) return;
    if (restaurando.current) {
      restaurando.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(RASCUNHO_KEY, JSON.stringify(valores));
      } catch {
        /* storage cheio ou bloqueado: o formulário continua funcionando */
      }
    }, 600);
    return () => window.clearTimeout(id);
  }, [valores]);

  const limparRascunho = useCallback(() => {
    try {
      localStorage.removeItem(RASCUNHO_KEY);
    } catch {
      /* nada a fazer */
    }
    podeSalvar.current = true;
    setTemRascunho(false);
  }, []);

  const retomar = () => {
    try {
      const bruto = localStorage.getItem(RASCUNHO_KEY);
      if (bruto) {
        restaurando.current = true;
        setValores(normalizarRascunho(JSON.parse(bruto)));
      }
    } catch {
      /* rascunho corrompido: segue com o formulário limpo */
    }
    podeSalvar.current = true;
    setTemRascunho(false);
  };

  // ── Edição ────────────────────────────────────────────────────────────────

  const contar = () => {
    if (jaContou.current) return;
    jaContou.current = true;
    track("begin_registration", { origem: "wizard" });
  };

  const editar = useCallback((fn: (v: FormValues) => FormValues) => {
    contar();
    // Digitar com o banner na tela é a decisão de começar de novo: o banner sai
    // e o autosave destrava. Enquanto os dois convivessem, o CONTINUAR
    // restauraria o rascunho antigo por cima do que a pessoa acabou de digitar.
    podeSalvar.current = true;
    setTemRascunho(false);
    setValores((atual) => fn(atual));
  }, []);

  const setCampo = <B extends "crew" | "responsavel" | "capitao">(
    bloco: B,
    campo: keyof FormValues[B],
    valor: string
  ) => {
    editar((v) => ({ ...v, [bloco]: { ...v[bloco], [campo]: valor } }));
    setErros((e) => {
      const { [`${bloco}.${String(campo)}`]: _, ...resto } = e;
      return resto;
    });
  };

  const setAtleta = (
    categoria: Categoria,
    grupo: "atletas" | "reservas",
    indice: number,
    campo: keyof AtletaForm,
    valor: string
  ) => {
    editar((v) => {
      const lista = [...v.equipes[categoria][grupo]];
      lista[indice] = { ...lista[indice], [campo]: valor };
      return {
        ...v,
        equipes: { ...v.equipes, [categoria]: { ...v.equipes[categoria], [grupo]: lista } },
      };
    });
    setErros((e) => {
      const chave = `equipes.${categoria}.${grupo}.${indice}.${campo}`;
      const { [chave]: _, ...resto } = e;
      return resto;
    });
  };

  /** O capitão espelha o responsável enquanto o atalho estiver marcado. */
  useEffect(() => {
    if (!valores.capitaoEhResponsavel) return;
    setValores((v) =>
      v.capitao.nome === v.responsavel.nome &&
      v.capitao.telefone === v.responsavel.telefone &&
      v.capitao.email === v.responsavel.email
        ? v
        : {
            ...v,
            capitao: {
              nome: v.responsavel.nome,
              telefone: v.responsavel.telefone,
              email: v.responsavel.email,
            },
          }
    );
  }, [valores.capitaoEhResponsavel, valores.responsavel]);

  const escolherCategoria = (categoria: CategoriaInscricao) => {
    editar((v) => ({ ...v, crew: { ...v.crew, categoria } }));
    setAbaCategoria(categoria === "feminino" ? "feminino" : "masculino");
    setErros((e) => {
      const { "crew.categoria": _, ...resto } = e;
      return resto;
    });
  };

  const escolherLogo = (arquivo: File | null) => {
    if (!arquivo) {
      setLogo(null);
      setLogoPreview(null);
      return;
    }
    if (arquivo.size > LOGO_MAX_BYTES) {
      setErros((e) => ({ ...e, logo: "A imagem precisa ter no máximo 3 MB" }));
      return;
    }
    setErros((e) => {
      const { logo: _, ...resto } = e;
      return resto;
    });
    setLogo(arquivo);
    setLogoPreview(URL.createObjectURL(arquivo));
  };

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  // ── Navegação ─────────────────────────────────────────────────────────────

  const irPara = (destino: number) => {
    setEtapa(destino);
    setErroEnvio(null);
    topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const avancar = () => {
    const encontrados = validarEtapa(etapa, valores);
    setErros(encontrados);

    const chaves = Object.keys(encontrados);
    if (chaves.length > 0) {
      // abre o cartão do primeiro atleta com problema, senão o erro fica escondido
      const doAtleta = chaves.find((c) => c.startsWith("equipes."));
      if (doAtleta) {
        const [, categoria, grupo, indice] = doAtleta.split(".");
        setAbertos((a) => ({ ...a, [`${categoria}.${grupo}.${indice}`]: true }));
        if (categoria === "masculino" || categoria === "feminino") setAbaCategoria(categoria);
      }
      topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (etapa === 5) {
      void enviar();
      return;
    }

    const proxima = etapa + 1;
    track("registration_step", { etapa: proxima });
    irPara(proxima);
  };

  // ── Envio ─────────────────────────────────────────────────────────────────

  async function enviar() {
    setEnviando(true);
    setErroEnvio(null);

    // Só as equipes que a categoria escolhida exige vão no corpo.
    const equipes: Record<string, { atletas: AtletaForm[]; reservas: AtletaForm[] }> = {};
    for (const categoria of categorias) {
      equipes[categoria] = {
        atletas: valores.equipes[categoria].atletas,
        reservas: valores.equipes[categoria].reservas,
      };
    }

    const corpo = {
      crew: valores.crew,
      responsavel: valores.responsavel,
      capitao: valores.capitao,
      equipes,
      aceite_regulamento: valores.aceite_regulamento,
      aceite_imagem: valores.aceite_imagem,
      aceite_veracidade: valores.aceite_veracidade,
      ...readAttribution(),
      website: honeypot.current?.value ?? "",
    };

    try {
      const resposta = await fetch("/api/o-longao/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const dados = (await resposta.json()) as {
        ok?: boolean;
        codigo?: string;
        crew_token?: string;
        categorias?: Categoria[];
        error?: string;
        campo?: string;
        cpfs_conflito?: string[];
      };

      if (!resposta.ok || !dados.ok) {
        if (resposta.status === 429) {
          setErroEnvio("Muitas tentativas seguidas. Aguarde um instante e tente de novo.");
        } else if (dados.cpfs_conflito?.length) {
          setErroEnvio(
            `${dados.error ?? "Atleta já inscrito por outra crew."} (${dados.cpfs_conflito.join(", ")})`
          );
          irPara(3);
        } else {
          setErroEnvio(dados.error ?? "Não foi possível enviar agora. Tente novamente.");
          if (dados.campo) irPara(etapaDoCampo(dados.campo));
        }
        setEnviando(false);
        return;
      }

      track("complete_registration", { categorias: categorias.join("+") });

      // A logo é um extra: se falhar, a inscrição já está feita e não volta atrás.
      if (logo && dados.crew_token) {
        try {
          const fd = new FormData();
          fd.append("logo", logo);
          fd.append("crew_token", dados.crew_token);
          await fetch("/api/o-longao/logo", { method: "POST", body: fd });
        } catch {
          /* silencioso de propósito */
        }
      }

      limparRascunho();
      setResultado({
        crew: valores.crew.nome,
        codigo: dados.codigo ?? "",
        categorias: dados.categorias ?? categorias,
      });
      setEtapa(6);
      topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setErroEnvio("Falha de conexão. Confira a internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (etapa === 6 && resultado) {
    return (
      <div ref={topo} className="lgo-wrap py-10">
        <Confirmada {...resultado} />
      </div>
    );
  }

  const progresso = etapa / (ETAPAS.length - 1);

  return (
    <div ref={topo} className="lgo-wrap scroll-mt-20 pb-32 pt-8 md:pb-16">
      {/* honeypot: humano não vê, bot preenche */}
      <input
        ref={honeypot}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />

      {temRascunho ? (
        <div className="lgo-panel mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[color:rgba(242,240,236,0.8)]">
            Retomamos sua inscrição de onde parou.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={retomar} className="lgo-btn min-h-[44px] px-4 py-2 text-xs">
              CONTINUAR
            </button>
            <button
              type="button"
              onClick={limparRascunho}
              className="lgo-btn lgo-btn--ghost min-h-[44px] px-4 py-2 text-xs"
            >
              RECOMEÇAR
            </button>
          </div>
        </div>
      ) : null}

      {/* Progresso */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between">
          <p className="lgo-label text-[color:var(--sinal)]">
            ETAPA {String(etapa).padStart(2, "0")} DE {String(ETAPAS.length - 1).padStart(2, "0")}
          </p>
          <p className="lgo-label text-[color:rgba(242,240,236,0.45)]">
            {ETAPAS[etapa - 1]?.titulo}
          </p>
        </div>
        <div className="mt-2 h-[3px] overflow-hidden bg-[color:var(--noite-3)]">
          <div
            className="h-full origin-left transition-transform duration-700"
            style={{ background: "var(--timing)", transform: `scaleX(${progresso})` }}
          />
        </div>
        <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {ETAPAS.slice(0, -1).map((e) => (
            <li key={e.n}>
              <button
                type="button"
                disabled={e.n >= etapa}
                onClick={() => irPara(e.n)}
                className={`lgo-label py-1 ${
                  e.n === etapa
                    ? "text-[color:var(--papel)]"
                    : e.n < etapa
                      ? "text-[color:rgba(242,240,236,0.5)] underline underline-offset-4"
                      : "text-[color:rgba(242,240,236,0.25)]"
                }`}
              >
                {e.titulo}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* ETAPA 1 — CREW */}
      {etapa === 1 ? (
        <section>
          <BlocoTitulo kicker="QUEM ESTÁ ENTRANDO" titulo="SUA CREW" />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Campo
                id="crew-nome"
                label="Nome da crew"
                value={valores.crew.nome}
                erro={erros["crew.nome"]}
                onChange={(e) => setCampo("crew", "nome", e.target.value)}
              />
            </div>
            <Campo
              id="crew-instagram"
              label="Instagram da crew (@)"
              value={valores.crew.instagram}
              erro={erros["crew.instagram"]}
              autoCapitalize="none"
              onChange={(e) => setCampo("crew", "instagram", e.target.value)}
            />
            <Campo
              id="crew-cidade"
              label="Cidade"
              value={valores.crew.cidade}
              erro={erros["crew.cidade"]}
              onChange={(e) => setCampo("crew", "cidade", e.target.value)}
            />
          </div>

          <fieldset className="mt-8">
            <legend className="lgo-label mb-3 text-[color:rgba(242,240,236,0.6)]">
              CATEGORIA
            </legend>
            <div className="grid gap-3 md:grid-cols-3">
              {CATEGORIAS_INSCRICAO.map((c) => {
                const ativa = valores.crew.categoria === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={ativa}
                    onClick={() => escolherCategoria(c)}
                    className={`lgo-panel min-h-[44px] p-4 text-left transition-colors ${
                      ativa ? "border-[color:var(--sinal)]" : ""
                    }`}
                  >
                    <span
                      className={`lgo-display lgo-display-condensed block text-xl ${
                        ativa ? "text-[color:var(--sinal)]" : ""
                      }`}
                    >
                      {ROTULO_ESCOLHA[c].titulo}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[color:rgba(242,240,236,0.55)]">
                      {ROTULO_ESCOLHA[c].texto}
                    </span>
                  </button>
                );
              })}
            </div>
            {erros["crew.categoria"] ? (
              <p className="lgo-mono mt-2 text-xs text-[color:var(--somma)]">
                {erros["crew.categoria"]}
              </p>
            ) : null}
          </fieldset>

          <div className="mt-8">
            <p className="lgo-label mb-3 text-[color:rgba(242,240,236,0.6)]">
              LOGO DA CREW (OPCIONAL)
            </p>
            <div className="flex items-center gap-4">
              <div className="lgo-slot relative h-20 w-20 shrink-0">
                {logoPreview ? (
                  <Image src={logoPreview} alt="" fill sizes="80px" className="object-contain p-1.5" unoptimized />
                ) : (
                  <span className="lgo-label absolute inset-0 grid place-content-center text-[color:rgba(242,240,236,0.3)]">
                    LOGO
                  </span>
                )}
              </div>
              <div>
                <label
                  htmlFor="crew-logo"
                  className="lgo-btn lgo-btn--ghost inline-flex min-h-[44px] cursor-pointer px-4 py-2 text-xs"
                >
                  {logo ? "TROCAR IMAGEM" : "ESCOLHER IMAGEM"}
                </label>
                <input
                  id="crew-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => escolherLogo(e.target.files?.[0] ?? null)}
                />
                <p className="lgo-mono mt-2 text-xs text-[color:rgba(242,240,236,0.4)]">
                  PNG, JPG ou WEBP até 3 MB
                </p>
                {erros.logo ? (
                  <p className="lgo-mono mt-1 text-xs text-[color:var(--somma)]">{erros.logo}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ETAPA 2 — RESPONSÁVEL E CAPITÃO */}
      {etapa === 2 ? (
        <section>
          <BlocoTitulo kicker="QUEM RESPONDE PELA CREW" titulo="RESPONSÁVEL" />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Campo
                id="resp-nome"
                label="Nome completo"
                value={valores.responsavel.nome}
                erro={erros["responsavel.nome"]}
                onChange={(e) => setCampo("responsavel", "nome", nomeDigitando(e.target.value))}
              />
            </div>
            <Campo
              id="resp-cpf"
              label="CPF"
              inputMode="numeric"
              value={valores.responsavel.cpf}
              erro={erros["responsavel.cpf"]}
              onChange={(e) => setCampo("responsavel", "cpf", formatCPF(e.target.value))}
            />
            <Campo
              id="resp-email"
              label="E-mail"
              type="email"
              inputMode="email"
              value={valores.responsavel.email}
              erro={erros["responsavel.email"]}
              onChange={(e) => setCampo("responsavel", "email", e.target.value)}
            />
            <Campo
              id="resp-telefone"
              label="Telefone"
              inputMode="tel"
              value={valores.responsavel.telefone}
              erro={erros["responsavel.telefone"]}
              onChange={(e) => setCampo("responsavel", "telefone", maskPhone(e.target.value))}
            />
            <Campo
              id="resp-whatsapp"
              label="WhatsApp"
              inputMode="tel"
              value={valores.responsavel.whatsapp}
              erro={erros["responsavel.whatsapp"]}
              onChange={(e) => setCampo("responsavel", "whatsapp", maskPhone(e.target.value))}
            />
          </div>

          <div className="mt-10">
            <BlocoTitulo kicker="QUEM DECIDE A ESCALA" titulo="CAPITÃO" />
            <Aceite
              id="capitao-igual"
              checked={valores.capitaoEhResponsavel}
              onChange={(v) => editar((atual) => ({ ...atual, capitaoEhResponsavel: v }))}
            >
              O capitão é a mesma pessoa do responsável.
            </Aceite>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Campo
                  id="cap-nome"
                  label="Nome completo"
                  value={valores.capitao.nome}
                  erro={erros["capitao.nome"]}
                  disabled={valores.capitaoEhResponsavel}
                  onChange={(e) => setCampo("capitao", "nome", nomeDigitando(e.target.value))}
                />
              </div>
              <Campo
                id="cap-telefone"
                label="Telefone"
                inputMode="tel"
                value={valores.capitao.telefone}
                erro={erros["capitao.telefone"]}
                disabled={valores.capitaoEhResponsavel}
                onChange={(e) => setCampo("capitao", "telefone", maskPhone(e.target.value))}
              />
              <Campo
                id="cap-email"
                label="E-mail"
                type="email"
                inputMode="email"
                value={valores.capitao.email}
                erro={erros["capitao.email"]}
                disabled={valores.capitaoEhResponsavel}
                onChange={(e) => setCampo("capitao", "email", e.target.value)}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* ETAPAS 3 e 4 — ATLETAS E RESERVAS */}
      {etapa === 3 || etapa === 4 ? (
        <section>
          <BlocoTitulo
            kicker={etapa === 3 ? `OS ${FORMATO.titulares} QUE ASSINAM A DISTÂNCIA` : "O PLANO B DA CREW"}
            titulo={etapa === 3 ? "ATLETAS" : "RESERVAS"}
          />

          {categorias.length > 1 ? (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {categorias.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={abaCategoria === c}
                  onClick={() => setAbaCategoria(c)}
                  className={`lgo-label min-h-[44px] shrink-0 border px-4 ${
                    abaCategoria === c
                      ? "border-[color:var(--sinal)] text-[color:var(--sinal)]"
                      : "border-[color:var(--line)] text-[color:rgba(242,240,236,0.5)]"
                  }`}
                >
                  {ROTULO_CATEGORIA[c]}
                  {etapa === 3 ? ` ${contarCompletos(valores, c)}/${FORMATO.titulares}` : ""}
                </button>
              ))}
            </div>
          ) : null}

          {categorias.length === 0 ? (
            <p className="lgo-panel p-4 text-sm text-[color:rgba(242,240,236,0.7)]">
              Escolha a categoria na etapa 1 para cadastrar os atletas.
            </p>
          ) : null}

          {categorias
            .filter((c) => categorias.length === 1 || c === abaCategoria)
            .map((categoria) => {
              const grupo = etapa === 3 ? "atletas" : "reservas";
              const lista = valores.equipes[categoria][grupo];
              return (
                <div key={categoria}>
                  {categorias.length === 1 ? null : (
                    <p className="lgo-label mb-3 text-[color:rgba(242,240,236,0.45)]">
                      {ROTULO_CATEGORIA[categoria]}
                    </p>
                  )}

                  <ul className="flex flex-col gap-2">
                    {lista.map((atleta, i) => {
                      const chave = `${categoria}.${grupo}.${i}`;
                      const errosDoAtleta: Record<string, string> = {};
                      for (const [caminho, msg] of Object.entries(erros)) {
                        const prefixo = `equipes.${categoria}.${grupo}.${i}.`;
                        if (caminho.startsWith(prefixo)) {
                          errosDoAtleta[caminho.slice(prefixo.length)] = msg;
                        }
                      }
                      return (
                        <AtletaCard
                          key={chave}
                          atleta={atleta}
                          indice={i}
                          rotulo={etapa === 3 ? `ATLETA ${String(i + 1).padStart(2, "0")}` : `RESERVA ${i + 1}`}
                          erros={errosDoAtleta}
                          aberto={Boolean(abertos[chave])}
                          onToggle={() => setAbertos((a) => ({ ...a, [chave]: !a[chave] }))}
                          onChange={(campo, valor) => setAtleta(categoria, grupo, i, campo, valor)}
                          onRemover={
                            etapa === 4
                              ? () =>
                                  editar((v) => ({
                                    ...v,
                                    equipes: {
                                      ...v.equipes,
                                      [categoria]: {
                                        ...v.equipes[categoria],
                                        reservas: v.equipes[categoria].reservas.filter((_, j) => j !== i),
                                      },
                                    },
                                  }))
                              : undefined
                          }
                        />
                      );
                    })}
                  </ul>

                  {etapa === 4 ? (
                    <>
                      {lista.length < FORMATO.reservasMax ? (
                        <button
                          type="button"
                          onClick={() =>
                            editar((v) => ({
                              ...v,
                              equipes: {
                                ...v.equipes,
                                [categoria]: {
                                  ...v.equipes[categoria],
                                  reservas: [...v.equipes[categoria].reservas, atletaVazio()],
                                },
                              },
                            }))
                          }
                          className="lgo-btn lgo-btn--ghost mt-3 w-full"
                        >
                          + ADICIONAR RESERVA
                        </button>
                      ) : null}
                      <p className="lgo-mono mt-3 text-xs text-[color:rgba(242,240,236,0.45)]">
                        Até {FORMATO.reservasMax} por equipe. Esta etapa é opcional: dá para seguir sem
                        nenhuma reserva.
                      </p>
                    </>
                  ) : null}
                </div>
              );
            })}
        </section>
      ) : null}

      {/* ETAPA 5 — REVISÃO */}
      {etapa === 5 ? (
        <section>
          <BlocoTitulo kicker="ÚLTIMA CONFERIDA" titulo="REVISÃO" />
          <Revisao
            valores={valores}
            erros={erros}
            onIrPara={irPara}
            onAceite={(campo, v) => {
              editar((atual) => ({ ...atual, [campo]: v }));
              setErros((e) => {
                const { [campo]: _, ...resto } = e;
                return resto;
              });
            }}
          />
        </section>
      ) : null}

      {Object.keys(erros).length > 0 ? (
        <p className="lgo-mono mt-6 text-sm text-[color:var(--somma)]">
          Confira os campos marcados antes de seguir.
        </p>
      ) : null}
      {erroEnvio ? (
        <p className="lgo-panel lgo-mono mt-6 border-[color:var(--somma)] p-4 text-sm text-[color:var(--somma)]">
          {erroEnvio}
        </p>
      ) : null}

      {/* Navegação: fixa no rodapé do mobile, no fluxo no desktop */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--line)] bg-[color:var(--noite)]/95 backdrop-blur md:static md:mt-10 md:border-0 md:bg-transparent md:backdrop-blur-none">
        <div
          className="lgo-wrap flex gap-3 py-3 md:px-0 md:py-0"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {etapa > 1 ? (
            <button
              type="button"
              onClick={() => irPara(etapa - 1)}
              className="lgo-btn lgo-btn--ghost flex-1 md:flex-none md:px-8"
            >
              VOLTAR
            </button>
          ) : null}
          <button
            type="button"
            onClick={avancar}
            disabled={enviando}
            className="lgo-btn flex-[2] disabled:opacity-60 md:flex-none md:px-10"
          >
            {enviando ? "ENVIANDO..." : etapa === 5 ? "ENVIAR INSCRIÇÃO" : "AVANÇAR"}
          </button>
        </div>
      </div>

      {etapa === 5 ? (
        <p className="lgo-mono mt-4 text-xs text-[color:rgba(242,240,236,0.4)]">
          Ao enviar, você concorda com o{" "}
          <a href={LINKS.regulamento} target="_blank" rel="noopener noreferrer" className="underline">
            regulamento
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
