"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CAMINHO, ROTULO_CURTO, type DistanciaInscricao } from "@/lib/evp/config";
import { dataHora } from "@/lib/evp/formato";
import { cpfMascarado } from "@/lib/evp/schema";
import type { Sessao } from "@/lib/evp/tipos";
import { BotaoSair } from "../../admin/_components/LoginEquipe";

type Pessoa = { id: string; nome: string; codigo: string; distancia: DistanciaInscricao; cpf_final: string };
type Resultado = {
  ok: boolean;
  motivo?: string;
  error?: string;
  inscricao?: Pessoa;
  feito_em?: string;
  operador?: string;
  presentes?: number;
};
type Linha = Pessoa & { status: "confirmada" | "lista_espera"; checkin_em: string | null };
type Resumo = {
  confirmadas: number;
  presentes: number;
  ultimos: { nome: string; codigo: string; distancia: DistanciaInscricao; feito_em: string; operador: string; via: string }[];
};

const TITULO_RECUSA: Record<string, string> = {
  invalido: "QR Code inválido",
  duplicado: "Check-in já feito",
  cancelada: "Inscrição cancelada",
  lista_espera: "Sem vaga confirmada",
  sem_permissao: "Sem permissão",
};

/**
 * Credenciamento no celular: lê o QR Code pela câmera ou busca a pessoa pelo
 * nome, código ou CPF. O aparelho só mostra o resultado: quem confere a
 * credencial e grava a presença é o servidor.
 */
export function Credenciamento({ sessao }: { sessao: Sessao }) {
  const router = useRouter();
  const [modo, setModo] = useState<"qr" | "busca">("qr");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const [camera, setCamera] = useState<"parada" | "abrindo" | "ligada" | "negada" | "sem_suporte">("parada");
  const video = useRef<HTMLVideoElement>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const laco = useRef<number>(0);
  const ultimoLido = useRef<{ texto: string; em: number }>({ texto: "", em: 0 });
  const travado = useRef(false);

  const [termo, setTermo] = useState("");
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  const carregarResumo = useCallback(async () => {
    try {
      const r = await fetch("/api/evp/checkin", { cache: "no-store" });
      if (r.status === 401 || r.status === 403) return router.refresh();
      if (r.ok) setResumo((await r.json()) as Resumo);
    } catch {
      /* mantém o último resumo */
    }
  }, [router]);

  useEffect(() => {
    void carregarResumo();
    const t = setInterval(carregarResumo, 20_000);
    return () => clearInterval(t);
  }, [carregarResumo]);

  const registrar = useCallback(
    async (corpo: { qr: string } | { id: string }) => {
      if (travado.current) return;
      travado.current = true;
      setOcupado(true);
      try {
        const r = await fetch("/api/evp/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
        if (r.status === 401) return router.refresh();
        const j = (await r.json().catch(() => ({}))) as Resultado;
        setResultado({ ...j, ok: r.ok && j.ok === true, error: j.error ?? (r.ok ? undefined : "Falha ao registrar. Tente de novo.") });
        try {
          navigator.vibrate?.(r.ok ? 80 : [60, 60, 140]);
        } catch {
          /* aparelho sem vibração */
        }
        void carregarResumo();
        if ("id" in corpo) setLinhas((ls) => ls?.map((l) => (l.id === corpo.id && r.ok ? { ...l, checkin_em: j.feito_em ?? new Date().toISOString() } : l)) ?? null);
      } catch {
        setResultado({ ok: false, error: "Sem conexão. A presença NÃO foi registrada: tente de novo." });
      } finally {
        setOcupado(false);
      }
    },
    [carregarResumo, router]
  );

  const pararCamera = useCallback(() => {
    cancelAnimationFrame(laco.current);
    fluxo.current?.getTracks().forEach((t) => t.stop());
    fluxo.current = null;
    setCamera((c) => (c === "ligada" || c === "abrindo" ? "parada" : c));
  }, []);

  async function ligarCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return setCamera("sem_suporte");
    setCamera("abrindo");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      fluxo.current = s;
      const v = video.current;
      if (!v) return;
      v.srcObject = s;
      await v.play();
      setCamera("ligada");

      const { default: jsQR } = await import("jsqr");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      let ultimo = 0;
      const quadro = (agora: number) => {
        laco.current = requestAnimationFrame(quadro);
        // Uns 7 quadros por segundo bastam e poupam bateria.
        if (!ctx || agora - ultimo < 140 || travado.current || v.readyState < 2) return;
        ultimo = agora;
        const escala = Math.min(1, 640 / v.videoWidth);
        canvas.width = Math.round(v.videoWidth * escala);
        canvas.height = Math.round(v.videoHeight * escala);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const lido = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data?.trim();
        if (!lido) return;
        // O mesmo código parado na frente da câmera não dispara de novo por 4 s.
        if (lido === ultimoLido.current.texto && agora - ultimoLido.current.em < 4000) return;
        ultimoLido.current = { texto: lido, em: agora };
        void registrar({ qr: lido });
      };
      laco.current = requestAnimationFrame(quadro);
    } catch (erro) {
      fluxo.current?.getTracks().forEach((t) => t.stop());
      fluxo.current = null;
      setCamera(erro instanceof DOMException && (erro.name === "NotAllowedError" || erro.name === "SecurityError") ? "negada" : "sem_suporte");
    }
  }

  useEffect(() => pararCamera, [pararCamera]);
  useEffect(() => {
    if (modo !== "qr") pararCamera();
  }, [modo, pararCamera]);

  // Busca manual, com um respiro de 300 ms entre a digitação e a consulta.
  useEffect(() => {
    if (modo !== "busca") return;
    const q = termo.trim();
    if (q.length < 2) {
      setLinhas(null);
      return;
    }
    setBuscando(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/evp/checkin/buscar?q=${encodeURIComponent(q)}`, { cache: "no-store", signal: ctrl.signal });
        if (r.status === 401) return router.refresh();
        const j = (await r.json().catch(() => ({}))) as { resultados?: Linha[] };
        setLinhas(j.resultados ?? []);
      } catch {
        /* busca cancelada pela próxima letra */
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [termo, modo, router]);

  function fecharResultado() {
    setResultado(null);
    travado.current = false;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[34rem] flex-col gap-4 px-4 pb-8" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mt-rotulo">Credenciamento · Meeting Técnico</p>
          <p className="truncate text-[0.95rem] font-semibold">{sessao.nome}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {sessao.papel === "admin" && (
            <Link href={`${CAMINHO}/admin`} className="mt-botao mt-botao--linha mt-botao--pequeno">Painel</Link>
          )}
          <BotaoSair />
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[color:var(--mt-linha)] bg-[color:var(--mt-linha)]" aria-live="polite">
        <div className="bg-[color:var(--mt-carvao)] p-4">
          <dt className="mt-rotulo">Presentes</dt>
          <dd className="mt-display mt-1 text-[3.2rem] text-[color:var(--mt-laranja)]">{resumo?.presentes ?? "·"}</dd>
        </div>
        <div className="bg-[color:var(--mt-carvao)] p-4">
          <dt className="mt-rotulo">Confirmados</dt>
          <dd className="mt-display mt-1 text-[3.2rem]">{resumo?.confirmadas ?? "·"}</dd>
        </div>
      </dl>

      <div role="tablist" aria-label="Forma de credenciar" className="grid grid-cols-2 gap-2">
        {([["qr", "Ler QR Code"], ["busca", "Buscar pessoa"]] as const).map(([id, rotulo]) => (
          <button key={id} role="tab" type="button" aria-selected={modo === id} onClick={() => setModo(id)}
            className="mt-botao mt-botao--pequeno" style={{ background: modo === id ? "var(--mt-branco)" : "transparent", color: modo === id ? "var(--mt-preto)" : "var(--mt-branco)", borderColor: "var(--mt-linha-forte)" }}>
            {rotulo}
          </button>
        ))}
      </div>

      {modo === "qr" && (
        <section aria-label="Leitor de QR Code" className="mt-cartao overflow-hidden">
          <div className="relative aspect-square bg-black">
            <video ref={video} playsInline muted className="absolute inset-0 h-full w-full object-cover" style={{ display: camera === "ligada" ? "block" : "none" }} />
            {camera === "ligada" && (
              <div aria-hidden className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-[color:var(--mt-laranja)] shadow-[0_0_0_100vmax_rgba(0,0,0,0.35)]" />
            )}
            {camera !== "ligada" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                {camera === "negada" ? (
                  <p role="alert" className="text-[0.95rem] leading-relaxed text-[#ffb3b3]">
                    A câmera foi bloqueada. Libere o acesso nas configurações do navegador e tente de novo, ou use
                    &ldquo;Buscar pessoa&rdquo;.
                  </p>
                ) : camera === "sem_suporte" ? (
                  <p role="alert" className="text-[0.95rem] leading-relaxed text-[#ffb3b3]">
                    Não foi possível abrir a câmera neste aparelho. Use &ldquo;Buscar pessoa&rdquo;.
                  </p>
                ) : (
                  <p className="text-[0.95rem] leading-relaxed text-[#cfcfcf]">Aponte a câmera para o QR Code do ingresso.</p>
                )}
                <button type="button" onClick={ligarCamera} disabled={camera === "abrindo"} className="mt-botao mt-botao--cheio">
                  {camera === "abrindo" ? "Abrindo a câmera" : "Ligar a câmera"}
                </button>
              </div>
            )}
          </div>
          {camera === "ligada" && (
            <div className="flex items-center justify-between gap-3 p-3">
              <p className="text-[0.85rem] text-[color:var(--mt-cinza)]">{ocupado ? "Conferindo" : "Procurando QR Code"}</p>
              <button type="button" onClick={pararCamera} className="mt-botao mt-botao--linha mt-botao--pequeno">Desligar</button>
            </div>
          )}
        </section>
      )}

      {modo === "busca" && (
        <section aria-label="Busca manual" className="mt-cartao p-4">
          <label className="mt-campo">
            <span className="mt-rotulo">Nome, código da inscrição ou CPF completo</span>
            <input className="mt-input" type="search" inputMode="search" autoComplete="off" autoCapitalize="none" enterKeyHint="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Ex.: Maria, MT-ABC123" />
          </label>
          <div aria-live="polite" className="mt-3">
            {buscando && <p className="text-[0.88rem] text-[color:var(--mt-cinza)]">Buscando</p>}
            {!buscando && linhas?.length === 0 && <p className="text-[0.92rem] text-[#cfcfcf]">Ninguém encontrado. Confira a grafia ou tente o código do ingresso.</p>}
          </div>
          <ul className="mt-2 divide-y divide-[color:var(--mt-linha)]">
            {linhas?.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[1rem] font-semibold">{l.nome}</p>
                  <p className="mt-mono mt-0.5 text-[0.68rem] tracking-normal text-[color:var(--mt-cinza)]">
                    {l.codigo} · {ROTULO_CURTO[l.distancia]} · CPF {cpfMascarado(l.cpf_final)}
                  </p>
                </div>
                {l.status === "lista_espera" ? (
                  <span className="mt-selo mt-selo--espera shrink-0">Lista de espera</span>
                ) : l.checkin_em ? (
                  <span className="mt-selo mt-selo--ok shrink-0">Presente {dataHora(l.checkin_em).slice(-5)}</span>
                ) : (
                  <button type="button" disabled={ocupado} onClick={() => registrar({ id: l.id })} className="mt-botao mt-botao--cheio mt-botao--pequeno shrink-0">
                    Confirmar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {resumo && resumo.ultimos.length > 0 && (
        <section aria-label="Últimos check-ins" className="mt-cartao p-4">
          <h2 className="mt-rotulo">Últimos check-ins</h2>
          <ul className="mt-2 divide-y divide-[color:var(--mt-linha)]">
            {resumo.ultimos.map((u) => (
              <li key={`${u.codigo}-${u.feito_em}`} className="flex items-center justify-between gap-3 py-2.5 text-[0.9rem]">
                <span className="min-w-0 truncate">{u.nome}</span>
                <span className="mt-mono shrink-0 text-[0.68rem] tracking-normal text-[color:var(--mt-cinza)]">
                  {dataHora(u.feito_em).slice(-5)} · {u.operador.split(" ")[0]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resultado && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="resultado-titulo" className="fixed inset-0 z-50 flex flex-col justify-between p-6"
          style={{ background: resultado.ok ? "#0b7a3e" : "#a3170a", paddingTop: "calc(2rem + env(safe-area-inset-top))", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
          <div>
            <p className="mt-mono text-[0.75rem] text-white/80">{resultado.ok ? "Entrada liberada" : "Não liberar"}</p>
            <h2 id="resultado-titulo" className="mt-display mt-3 text-[clamp(3.2rem,16vw,5.5rem)] text-white">
              {resultado.ok ? "Presença confirmada" : TITULO_RECUSA[resultado.motivo ?? ""] ?? "Recusado"}
            </h2>
            {resultado.inscricao && (
              <div className="mt-6 rounded-2xl bg-black/25 p-5">
                <p className="text-[1.5rem] font-bold leading-tight text-white">{resultado.inscricao.nome}</p>
                <p className="mt-mono mt-2 text-[0.8rem] tracking-normal text-white/85">
                  {resultado.inscricao.codigo} · {ROTULO_CURTO[resultado.inscricao.distancia]} · CPF {cpfMascarado(resultado.inscricao.cpf_final)}
                </p>
              </div>
            )}
            {!resultado.ok && (
              <p className="mt-5 text-[1.05rem] leading-relaxed text-white">
                {resultado.error}
                {resultado.motivo === "duplicado" && resultado.feito_em && ` Registrado em ${dataHora(resultado.feito_em)}${resultado.operador ? `, por ${resultado.operador}` : ""}.`}
              </p>
            )}
          </div>
          <button type="button" autoFocus onClick={fecharResultado} className="mt-botao w-full bg-white text-[color:var(--mt-preto)]">
            Próxima pessoa
          </button>
        </div>
      )}
    </main>
  );
}
