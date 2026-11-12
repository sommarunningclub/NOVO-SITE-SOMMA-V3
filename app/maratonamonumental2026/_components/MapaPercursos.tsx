"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DISTANCIAS, PROVA, ROTULO_APOIO, type DistanciaBase } from "@/lib/evp/config";
import { distanciaMetros, pontoNoKm } from "@/lib/evp/percurso";
import { EASE, gsap, semMovimento } from "../_motion";
import { useEvento } from "./Contexto";
import { aoRecusarChave, carregarMaps, criarPino, ESTILO_ESCURO, MAP_ID, TEM_CHAVE, type Pino } from "./google";
import { Secao, Titulo } from "./Secao";

type Estado = "ocioso" | "carregando" | "pronto" | "erro";
type PontoKm = { km: number; tipo: "largada" | "chegada" | "corte" | "apoio"; titulo: string; texto: string };

const km = (n: number) => String(n).replace(".", ",");

/** O mapa trabalha com a meia e a maratona, as duas provas de domingo. */
const NO_MAPA = ["21k", "42k"] as const;
type DistanciaMapa = (typeof NO_MAPA)[number];
const ehDoMapa = (d: DistanciaBase): d is DistanciaMapa => (NO_MAPA as readonly string[]).includes(d);
/** Uma volta completa da animação, em segundos. */
const VOLTA_S: Record<DistanciaMapa, number> = { "21k": 26, "42k": 40 };

/** Régua do percurso: largada, apoio, cortes e chegada, na ordem dos quilômetros. Só dados do regulamento. */
function pontosDa(distancia: DistanciaBase): PontoKm[] {
  const d = DISTANCIAS[distancia];
  const cortes = new Map(d.cortes.map((c) => [c.km, c]));
  const apoio = new Map(d.apoio.map((a) => [a.km, a]));
  const kms = [...new Set([...cortes.keys(), ...apoio.keys()])].sort((a, b) => a - b);
  const meio: PontoKm[] = kms.map((k) => {
    const c = cortes.get(k);
    const a = apoio.get(k);
    const servicos = a ? a.tipos.map((t) => ROTULO_APOIO[t]).join(", ") : "";
    return c
      ? { km: k, tipo: "corte", titulo: `Ponto de corte · ${c.limite}`, texto: [c.regra, servicos && `No mesmo ponto: ${servicos}.`].filter(Boolean).join(" ") }
      : { km: k, tipo: "apoio", titulo: servicos, texto: `Ponto de apoio no km ${km(k)}.` };
  });
  return [
    { km: 0, tipo: "largada", titulo: "Largada", texto: `${PROVA.largada}. ${d.dia}, ${d.data.slice(0, 5)}, a partir das ${d.largada}.` },
    ...meio,
    { km: d.metros / 1000, tipo: "chegada", titulo: "Chegada", texto: `${PROVA.chegada}. Tempo limite oficial: ${d.limite}.` },
  ];
}

export function MapaPercursos() {
  const { distancia: escolhida, escolherDistancia, evento } = useEvento();
  // Quem escolheu 5 km ou 10 km no seletor continua vendo no mapa a última das duas provas de domingo.
  const [distancia, setDistancia] = useState<DistanciaMapa>(ehDoMapa(escolhida) ? escolhida : "21k");
  useEffect(() => {
    if (ehDoMapa(escolhida)) setDistancia(escolhida);
  }, [escolhida]);
  const d = DISTANCIAS[distancia];
  const percurso = evento.percursos.find((p) => p.distancia === distancia) ?? null;
  const pontos = useMemo(() => pontosDa(distancia), [distancia]);

  const caixa = useRef<HTMLDivElement>(null);
  const alvo = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const mapa = useRef<google.maps.Map | null>(null);
  const linha = useRef<google.maps.Polyline | null>(null);
  const pinos = useRef<Pino[]>([]);
  const kmAoVivo = useRef<HTMLSpanElement>(null);
  const naTela = useRef(false);
  const [rodando, setRodando] = useState(true);

  const [estado, setEstado] = useState<Estado>(TEM_CHAVE ? "ocioso" : "erro");
  const [perto, setPerto] = useState(false);
  const [ativo, setAtivo] = useState<number>(0);
  const [folha, setFolha] = useState(false);

  const rodandoRef = useRef(true);
  useEffect(() => {
    rodandoRef.current = rodando;
  }, [rodando]);

  useEffect(() => setAtivo(0), [distancia]);

  // A API só é pedida quando o mapa chega perto da tela.
  useEffect(() => {
    const el = caixa.current;
    if (!el || !TEM_CHAVE) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPerto(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A corrida no mapa só gasta bateria enquanto o mapa está na tela.
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (naTela.current = e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!perto || !alvo.current) return;
    let cancelado = false;
    setEstado("carregando");
    const parar = aoRecusarChave(() => !cancelado && setEstado("erro"));
    carregarMaps()
      .then(({ Map }) => {
        if (cancelado || !alvo.current) return;
        mapa.current = new Map(alvo.current, {
          center: PROVA.regiao,
          zoom: 14,
          disableDefaultUI: true,
          // Um dedo rola a página; o mapa pede dois dedos (ou Ctrl + rolagem).
          gestureHandling: "cooperative",
          backgroundColor: "#0d0d0d",
          clickableIcons: false,
          keyboardShortcuts: true,
          ...(MAP_ID ? { mapId: MAP_ID, colorScheme: "DARK" } : { styles: ESTILO_ESCURO }),
        });
        setEstado("pronto");
      })
      .catch(() => !cancelado && setEstado("erro"));
    return () => {
      cancelado = true;
      parar();
      pinos.current.forEach((p) => p.remover());
      pinos.current = [];
      linha.current?.setMap(null);
      linha.current = null;
      mapa.current = null;
    };
  }, [perto]);

  // Desenha o percurso da distância escolhida, ou a região da largada quando não há traçado validado.
  useEffect(() => {
    const m = mapa.current;
    if (estado !== "pronto" || !m) return;
    pinos.current.forEach((p) => p.remover());
    pinos.current = [];
    linha.current?.setMap(null);
    linha.current = null;

    if (!percurso) {
      m.panTo(PROVA.regiao);
      m.setZoom(14);
      pinos.current.push(
        criarPino(m, PROVA.regiao, {
          texto: "LARGADA E CHEGADA",
          classe: "mt-pino--regiao",
          titulo: "Esplanada dos Ministérios: região da largada e da chegada de todas as distâncias",
        })
      );
      return;
    }

    const caminho = percurso.coordenadas.map(([lng, lat]) => ({ lat, lng }));
    const pl = new google.maps.Polyline({ path: caminho, strokeColor: "#FF2C03", strokeWeight: 4, strokeOpacity: 0, geodesic: true, clickable: false, map: m });
    linha.current = pl;
    // Transição entre percursos: só a opacidade da linha, fora do laço de desenho do mapa.
    const parado = semMovimento();
    // Com a corrida ligada, o traçado inteiro fica ao fundo e o trecho percorrido acende por cima.
    const fundo = parado ? 1 : 0.38;
    const alfa = { v: parado ? fundo : 0 };
    const tween = gsap.to(alfa, { v: fundo, duration: 0.7, ease: EASE.soft, onUpdate: () => pl.setOptions({ strokeOpacity: alfa.v }) });
    if (parado) pl.setOptions({ strokeOpacity: 1 });

    // Corrida em loop: um ponto percorre o traçado do km 0 à chegada, sem parar, e recomeça.
    let quadro = 0;
    let trilha: google.maps.Polyline | null = null;
    let corredor: Pino | null = null;
    if (!parado) {
      const acumulado = [0];
      for (let i = 1; i < percurso.coordenadas.length; i++) {
        acumulado.push(acumulado[i - 1] + distanciaMetros(percurso.coordenadas[i - 1], percurso.coordenadas[i]));
      }
      const total = acumulado[acumulado.length - 1] || 1;
      trilha = new google.maps.Polyline({ path: [caminho[0]], strokeColor: "#FF2C03", strokeWeight: 6, strokeOpacity: 1, geodesic: true, clickable: false, zIndex: 3, map: m });
      corredor = criarPino(m, caminho[0], { texto: "", classe: "mt-pino--corredor", titulo: "Posição da corrida no percurso" });
      const volta = VOLTA_S[distancia] * 1000;
      const pausa = 1400; // respiro na chegada antes de largar de novo
      let inicio = 0;
      let parcial = 0; // tempo já corrido, guardado quando a animação pausa
      let ultimo = 0;
      const passo = (agora: number) => {
        quadro = requestAnimationFrame(passo);
        if (!naTela.current || document.hidden || !rodandoRef.current) {
          inicio = 0; // retoma de onde parou
          return;
        }
        if (!inicio) inicio = agora - parcial;
        parcial = (agora - inicio) % (volta + pausa);
        if (agora - ultimo < 33) return; // ~30 quadros por segundo bastam
        ultimo = agora;
        const f = Math.min(parcial / volta, 1);
        const alvoM = f * total;
        let i = 1;
        while (i < acumulado.length - 1 && acumulado[i] < alvoM) i++;
        const trecho = acumulado[i] - acumulado[i - 1] || 1;
        const r = (alvoM - acumulado[i - 1]) / trecho;
        const ponto = {
          lat: caminho[i - 1].lat + (caminho[i].lat - caminho[i - 1].lat) * r,
          lng: caminho[i - 1].lng + (caminho[i].lng - caminho[i - 1].lng) * r,
        };
        trilha?.setPath([...caminho.slice(0, i), ponto]);
        corredor?.mover(ponto);
        if (kmAoVivo.current) kmAoVivo.current.textContent = ((f * d.metros) / 1000).toFixed(1).replace(".", ",");
      };
      quadro = requestAnimationFrame(passo);
    }

    const limites = new google.maps.LatLngBounds();
    caminho.forEach((p) => limites.extend(p));
    m.fitBounds(limites, { top: 56, right: 40, bottom: window.innerWidth < 1024 ? 120 : 40, left: 40 });

    pontos.forEach((p, i) => {
      const c = p.tipo === "largada" ? percurso.coordenadas[0] : p.tipo === "chegada" ? percurso.coordenadas[percurso.coordenadas.length - 1] : pontoNoKm(percurso.coordenadas, p.km, d.metros);
      if (!c) return;
      // Largada e chegada no mesmo lugar: um pino só.
      if (p.tipo === "chegada" && Math.abs(c[0] - percurso.coordenadas[0][0]) < 0.0015 && Math.abs(c[1] - percurso.coordenadas[0][1]) < 0.0015) return;
      pinos.current.push(
        criarPino(m, { lat: c[1], lng: c[0] }, {
          texto: p.tipo === "largada" ? "LARGADA" : p.tipo === "chegada" ? "CHEGADA" : km(p.km),
          classe: `${p.tipo === "largada" || p.tipo === "chegada" ? "mt-pino--largada" : p.tipo === "corte" ? "mt-pino--corte" : ""} ${i === ativo ? "mt-pino--ativo" : ""}`,
          titulo: `Km ${km(p.km)}: ${p.titulo}`,
          aoClicar: () => {
            setAtivo(i);
            setFolha(true);
          },
        })
      );
    });
    return () => {
      tween.kill();
      cancelAnimationFrame(quadro);
      trilha?.setMap(null);
      corredor?.remover();
    };
    // `ativo` fica de fora de propósito: trocar o ponto não redesenha o percurso (ver efeito abaixo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, percurso, pontos, d.metros, distancia]);

  // Ponto escolhido na régua: o mapa vai até ele.
  useEffect(() => {
    const m = mapa.current;
    if (estado !== "pronto" || !m || !percurso) return;
    const p = pontos[ativo];
    if (!p) return;
    const c = p.tipo === "largada" ? percurso.coordenadas[0] : p.tipo === "chegada" ? percurso.coordenadas[percurso.coordenadas.length - 1] : pontoNoKm(percurso.coordenadas, p.km, d.metros);
    if (c && ativo !== 0) m.panTo({ lat: c[1], lng: c[0] });
  }, [ativo, estado, percurso, pontos, d.metros]);

  // Painel: os dados reentram quando a distância ou o ponto mudam.
  useEffect(() => {
    if (!painel.current || semMovimento()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-painel]", { y: 14, autoAlpha: 0, duration: 0.45, ease: EASE.soft, stagger: 0.04, clearProps: "all" });
    }, painel);
    return () => ctx.revert();
  }, [distancia, ativo]);

  const zoom = (delta: number) => mapa.current?.setZoom((mapa.current.getZoom() ?? 14) + delta);
  const centralizar = () => {
    const m = mapa.current;
    if (!m) return;
    if (percurso) {
      const limites = new google.maps.LatLngBounds();
      percurso.coordenadas.forEach(([lng, lat]) => limites.extend({ lat, lng }));
      m.fitBounds(limites, { top: 56, right: 40, bottom: window.innerWidth < 1024 ? 120 : 40, left: 40 });
    } else {
      m.panTo(PROVA.regiao);
      m.setZoom(14);
    }
  };

  const ponto = pontos[ativo] ?? pontos[0];
  const temApoio = d.apoio.length > 0 || d.cortes.length > 0;

  return (
    <Secao id="percursos" marco="03" rotulo="Os percursos no mapa">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Titulo id="percursos" linhas={["Cada quilômetro", "importa."]} />
        <p data-sobe className="mt-texto max-w-[27rem]">
          Veja a meia e a maratona correrem no mapa, do km 0 à chegada, e comece a entender o desafio que vem
          pela frente.
        </p>
      </div>

      <div data-sobe role="group" aria-label="Distância exibida no mapa" className="mt-8 flex gap-2">
        {NO_MAPA.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === distancia}
            onClick={() => escolherDistancia(id, "mapa")}
            className="mt-mono min-h-11 flex-1 rounded-full border px-3 text-[0.78rem] transition-colors duration-200 sm:flex-none sm:px-5"
            style={{
              background: id === distancia ? "var(--mt-laranja)" : "transparent",
              borderColor: id === distancia ? "var(--mt-laranja)" : "var(--mt-linha-forte)",
              color: id === distancia ? "var(--mt-preto)" : "var(--mt-branco)",
              fontWeight: id === distancia ? 700 : 400,
            }}
          >
            {DISTANCIAS[id].numero} km
          </button>
        ))}
      </div>

      <div data-sobe className="mt-3 grid gap-3 lg:grid-cols-12">
        <div ref={caixa} className="relative h-[min(68svh,34rem)] overflow-hidden rounded-2xl border border-[color:var(--mt-linha)] bg-[#0d0d0d] lg:col-span-8 lg:h-[38rem]">
          <div ref={alvo} className="absolute inset-0" aria-label={`Mapa de Brasília com o percurso de ${d.oficial}`} role="application" hidden={estado === "erro"} />

          {(estado === "ocioso" || estado === "carregando") && (
            <div className="absolute inset-0 grid place-items-center" role="status">
              <p className="mt-pendente">Carregando o mapa</p>
            </div>
          )}

          {estado === "erro" && (
            <div className="absolute inset-0 flex flex-col justify-center gap-4 p-6 sm:p-10">
              <p className="mt-rotulo !text-[color:var(--mt-laranja)]">Mapa interativo indisponível</p>
              <p className="max-w-[30rem] text-[1.05rem] leading-relaxed text-[#e2e2e2]">
                Não foi possível carregar o Google Maps agora. Os dados de cada quilômetro continuam ao lado, e os
                mapas oficiais da organização estão nos links abaixo.
              </p>
              <ul className="flex flex-wrap gap-2">
                {NO_MAPA.map((id) => (
                  <li key={id}>
                    <a href={DISTANCIAS[id].mapaOficial} target="_blank" rel="noopener noreferrer" className="mt-botao mt-botao--linha mt-botao--pequeno">
                      Mapa oficial {DISTANCIAS[id].numero} km (PDF)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {estado === "pronto" && !percurso && (
            <div className="absolute inset-x-3 top-3 max-w-[24rem] rounded-xl border border-[color:var(--mt-linha-forte)] bg-[rgba(8,8,8,0.92)] p-4 sm:left-4 sm:top-4 sm:right-auto">
              <p className="mt-pendente">Percurso em preparação</p>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-[#d4d4d4]">
                O traçado de {d.oficial} entra neste mapa quando o arquivo georreferenciado oficial for validado.
                Enquanto isso, veja o mapa publicado pela organização.
              </p>
              <a href={d.mapaOficial} target="_blank" rel="noopener noreferrer" className="mt-botao mt-botao--cheio mt-botao--pequeno mt-3">
                Abrir mapa oficial (PDF)<span className="mt-so-leitor">, abre em nova aba</span>
              </a>
            </div>
          )}

          {estado === "pronto" && percurso && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-[color:var(--mt-linha-forte)] bg-[rgba(8,8,8,0.92)] py-1 pl-4 pr-1 motion-reduce:hidden">
              <p className="mt-mono text-[0.72rem] tracking-normal" aria-hidden>
                <span className="text-[color:var(--mt-laranja)]">KM </span>
                <span ref={kmAoVivo} className="inline-block min-w-[2.6rem] text-[0.95rem] font-bold">0,0</span>
                <span className="text-[color:var(--mt-cinza)]"> / {d.numero}</span>
              </p>
              <button
                type="button"
                onClick={() => setRodando((v) => !v)}
                aria-pressed={!rodando}
                aria-label={rodando ? "Pausar a corrida no mapa" : "Retomar a corrida no mapa"}
                className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--mt-grafite)] text-[0.8rem] transition-colors hover:bg-[#2a2a2a]"
              >
                <span aria-hidden>{rodando ? "❚❚" : "▶"}</span>
              </button>
            </div>
          )}

          {estado === "pronto" && (
            <div className="absolute right-3 top-3 flex flex-col gap-1.5 max-sm:top-auto max-sm:bottom-[4.75rem]">
              {[
                { rotulo: "Aproximar", texto: "+", acao: () => zoom(1) },
                { rotulo: "Afastar", texto: "−", acao: () => zoom(-1) },
                { rotulo: "Centralizar o percurso", texto: "◎", acao: centralizar },
              ].map((b) => (
                <button key={b.rotulo} type="button" aria-label={b.rotulo} title={b.rotulo} onClick={b.acao}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--mt-linha-forte)] bg-[rgba(8,8,8,0.92)] text-[1.15rem] leading-none transition-colors hover:bg-[color:var(--mt-grafite)]">
                  <span aria-hidden>{b.texto}</span>
                </button>
              ))}
            </div>
          )}

          {/* Celular: o painel de quilômetros abre por baixo, sobre o mapa. */}
          <button
            type="button"
            aria-expanded={folha}
            aria-controls="painel-km"
            onClick={() => setFolha((v) => !v)}
            className="absolute inset-x-3 bottom-3 flex min-h-[3.25rem] items-center justify-between gap-3 rounded-xl border border-[color:var(--mt-linha-forte)] bg-[rgba(8,8,8,0.94)] px-4 text-left lg:hidden"
          >
            <span>
              <span className="mt-rotulo block">Km {km(ponto.km)} · {d.numero} km</span>
              <span className="block text-[0.92rem] font-semibold leading-tight">{ponto.titulo}</span>
            </span>
            <span className="mt-mono shrink-0 text-[0.68rem] text-[color:var(--mt-laranja)]">{folha ? "Fechar" : "Ver pontos"}</span>
          </button>
        </div>

        <div
          ref={painel}
          id="painel-km"
          className={`mt-cartao flex-col p-5 lg:col-span-4 lg:flex lg:h-[38rem] ${folha ? "flex" : "hidden"}`}
        >
          <p data-painel className="mt-rotulo">{d.dia}, {d.data.slice(0, 5)} · largada {d.largada} · limite {d.limite}</p>
          <p data-painel className="mt-display mt-3 text-[3rem]">{d.titulo}</p>

          <div data-painel aria-live="polite" className="mt-5 rounded-xl border border-[color:var(--mt-linha)] bg-[color:var(--mt-preto)] p-4">
            <p className="mt-mono text-[0.7rem] text-[color:var(--mt-laranja)]">Km {km(ponto.km)}</p>
            <p className="mt-1.5 text-[1.05rem] font-semibold leading-snug">{ponto.titulo}</p>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-[#cfcfcf]">{ponto.texto}</p>
            {percurso && ponto.tipo !== "largada" && ponto.tipo !== "chegada" && (
              <p className="mt-2 text-[0.78rem] leading-relaxed text-[color:var(--mt-cinza)]">
                Posição no mapa calculada pela distância ao longo do traçado.
              </p>
            )}
          </div>

          <p data-painel className="mt-rotulo mt-6">Régua do percurso</p>
          <ol data-painel className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1 max-lg:max-h-[18rem]">
            {pontos.map((p, i) => (
              <li key={`${p.tipo}-${p.km}`}>
                <button
                  type="button"
                  aria-current={i === ativo ? "true" : undefined}
                  onClick={() => setAtivo(i)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                  style={{ background: i === ativo ? "rgba(255,44,3,0.14)" : undefined }}
                >
                  <span className="mt-mono w-14 shrink-0 text-[0.72rem] tracking-normal" style={{ color: p.tipo === "corte" ? "var(--mt-laranja)" : "var(--mt-cinza)" }}>
                    {km(p.km)} km
                  </span>
                  <span className="text-[0.88rem] leading-snug">{p.titulo}</span>
                </button>
              </li>
            ))}
          </ol>
          {!temApoio && (
            <p className="mt-3 text-[0.82rem] leading-relaxed text-[color:var(--mt-cinza)]">
              O regulamento não detalha pontos de apoio para {d.oficial}. Consulte o mapa oficial da organização.
            </p>
          )}
        </div>
      </div>

      {percurso && (
        <p className="mt-4 max-w-[52rem] text-[0.82rem] leading-relaxed text-[color:var(--mt-cinza)]">
          Traçado de {d.oficial} no mapa: {percurso.fonte ?? "arquivo georreferenciado"}. Serve de referência para
          estudo. O percurso que vale no dia é o do mapa oficial da organização.
        </p>
      )}
      <p data-sobe className="mt-2 max-w-[52rem] text-[0.82rem] leading-relaxed text-[color:var(--mt-cinza)]">
        Quilometragens, pontos de apoio e cortes: regulamento oficial da {PROVA.nome}. A organização pode alterar
        percursos e horários. No celular, use dois dedos para mover o mapa.
      </p>
    </Secao>
  );
}
