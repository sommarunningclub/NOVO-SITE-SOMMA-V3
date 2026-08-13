"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUnit } from "@/lib/desafio-esteiras/event.config";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";
import { decodeQrFromRgba, navegadorPodeAbrirCamera } from "@/lib/desafio-esteiras/qr-scan";

interface Participante {
  full_name: string;
  unit_id: string;
  ticket_code: string;
  status: string;
  created_at?: string;
  checked_in_at?: string | null;
}

interface Resultado {
  resultado:
    | "validado"
    | "ja_utilizado"
    | "nao_encontrado"
    | "unidade_incorreta"
    | "cancelado"
    // a gestão fechou a chave do check-in; nenhum ticket é aceito até reabrir
    | "bloqueado";
  error?: string;
  checked_in_at?: string | null;
  checked_in_by?: string | null;
  participante?: Participante;
}

interface Achado extends Participante {
  id: string;
  cpf_mascarado: string;
  phone_mascarado: string;
  ticket_token: string;
}

/** Chrome/Android têm BarcodeDetector. Safari iOS não — o fallback é jsQR. */
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

function mensagemErroCamera(err: unknown): string {
  const nome = err instanceof DOMException ? err.name : "";
  if (nome === "NotAllowedError" || nome === "PermissionDeniedError") {
    return "Permita o acesso à câmera no Safari: toque em aA na barra de endereço → Permissões do site → Câmera.";
  }
  if (nome === "NotFoundError" || nome === "OverconstrainedError") {
    return "Nenhuma câmera disponível. Tire uma foto do QR ou use a leitura manual.";
  }
  if (nome === "NotReadableError") {
    return "A câmera está em uso por outro aplicativo. Feche-o e tente de novo.";
  }
  return "Não foi possível abrir a câmera. Tire uma foto do QR ou use a leitura manual.";
}

async function abrirCameraTraseira(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  }
}

const hora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

/**
 * Balcão de check-in.
 *
 * Três caminhos para o mesmo lugar: ler o QR pela câmera, digitar o código ou
 * procurar por nome/CPF/telefone. A validação em si é sempre no servidor —
 * a tela nunca decide sozinha se um ticket é válido.
 */
export function CheckinScanner({ session }: { session: OperatorSession }) {
  const [modo, setModo] = useState<"camera" | "manual">("manual");
  const [busca, setBusca] = useState("");
  const [achados, setAchados] = useState<Achado[] | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [cameraErro, setCameraErro] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const ultimoLido = useRef<{ valor: string; em: number }>({ valor: "", em: 0 });
  const validarRef = useRef<(valor: string) => Promise<void>>(async () => {});
  const ocupadoRef = useRef(false);

  const escopo = session.unitId ? getUnit(session.unitId)?.nome : "todas as unidades";

  const validar = useCallback(async (valor: string) => {
    if (!valor || ocupadoRef.current) return;
    ocupadoRef.current = true;
    setOcupado(true);
    setAchados(null);
    try {
      const res = await fetch("/api/desafio-esteiras/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: valor }),
      });
      const data = (await res.json()) as Resultado;
      setResultado(data);
      if (navigator.vibrate) navigator.vibrate(data.resultado === "validado" ? 60 : [40, 60, 40]);
    } catch {
      setResultado({ resultado: "nao_encontrado", error: "Falha de conexão." });
    } finally {
      ocupadoRef.current = false;
      setOcupado(false);
    }
  }, []);
  validarRef.current = validar;

  async function procurar(e: React.FormEvent) {
    e.preventDefault();
    const termo = busca.trim();
    if (termo.length < 3 || ocupadoRef.current) return;

    ocupadoRef.current = true;
    setOcupado(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/desafio-esteiras/admin/buscar?q=${encodeURIComponent(termo)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { resultados: Achado[]; error?: string };
      setAchados(data.resultados ?? []);
    } catch {
      setAchados([]);
    } finally {
      ocupadoRef.current = false;
      setOcupado(false);
    }
  }

  // ── Câmera ────────────────────────────────────────────────────────────────
  const pararCamera = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    loopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (modo !== "camera") {
      pararCamera();
      return;
    }

    let cancelado = false;

    (async () => {
      if (!navegadorPodeAbrirCamera()) {
        setCameraErro("Este navegador não abre a câmera. Tire uma foto do QR ou use a leitura manual.");
        return;
      }

      let detector: BarcodeDetectorLike | null = null;
      if (typeof window.BarcodeDetector === "function") {
        try {
          detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          detector = null;
        }
      }

      let stream: MediaStream;
      try {
        stream = await abrirCameraTraseira();
      } catch (err) {
        if (!cancelado) setCameraErro(mensagemErroCamera(err));
        return;
      }

      if (cancelado) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      let tentativas = 0;
      while (!videoRef.current && !cancelado && tentativas < 30) {
        await new Promise((r) => requestAnimationFrame(r));
        tentativas += 1;
      }

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelado) setCameraErro("Não foi possível iniciar a câmera. Recarregue a página e tente de novo.");
        return;
      }

      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        await new Promise((r) => setTimeout(r, 80));
        if (!cancelado) await video.play().catch(() => {});
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        if (!cancelado) setCameraErro("Não foi possível iniciar a leitura do QR.");
        return;
      }

      let ultimoTick = 0;
      const ler = async (agora: number) => {
        if (cancelado) return;

        if (!ocupadoRef.current && videoRef.current && videoRef.current.readyState >= 2 && agora - ultimoTick >= 140) {
          ultimoTick = agora;
          const v = videoRef.current;
          let bruto: string | null = null;

          if (detector) {
            try {
              const codigos = await detector.detect(v);
              bruto = codigos[0]?.rawValue?.trim() || null;
            } catch {
              detector = null;
            }
          }

          if (!bruto) {
            const maxW = 640;
            const vw = v.videoWidth || 640;
            const vh = v.videoHeight || 480;
            const escala = Math.min(1, maxW / vw);
            const w = Math.max(1, Math.round(vw * escala));
            const h = Math.max(1, Math.round(vh * escala));
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }
            ctx.drawImage(v, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            bruto = decodeQrFromRgba(img.data, w, h);
          }

          if (bruto && (bruto !== ultimoLido.current.valor || Date.now() - ultimoLido.current.em > 4000)) {
            ultimoLido.current = { valor: bruto, em: Date.now() };
            await validarRef.current(bruto);
          }
        }

        if (!cancelado) loopRef.current = requestAnimationFrame(ler);
      };

      loopRef.current = requestAnimationFrame(ler);
    })();

    return () => {
      cancelado = true;
      pararCamera();
    };
  }, [modo, pararCamera]);

  async function lerFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCameraErro(null);
    try {
      const bmp = await createImageBitmap(file);
      const maxW = 1280;
      const escala = Math.min(1, maxW / bmp.width);
      const w = Math.max(1, Math.round(bmp.width * escala));
      const h = Math.max(1, Math.round(bmp.height * escala));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bmp.close();
        setCameraErro("Não foi possível ler essa imagem.");
        return;
      }
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close();
      const img = ctx.getImageData(0, 0, w, h);
      const bruto = decodeQrFromRgba(img.data, w, h);
      if (bruto) await validar(bruto);
      else setCameraErro("Não encontrei um QR Code nessa foto. Chegue mais perto e use boa luz.");
    } catch {
      setCameraErro("Não foi possível ler essa imagem.");
    }
  }

  useEffect(() => () => pararCamera(), [pararCamera]);

  return (
    <main className="dst-wrap py-6 md:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--line)] pb-5">
        <div>
          <p className="dst-label text-[color:var(--somma)]">Check-in</p>
          <h1 className="dst-display mt-2 text-[clamp(1.5rem,6vw,2.4rem)]">VALIDAÇÃO DE TICKET</h1>
          <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.45)]">
            {session.nome} · escopo: {escopo}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/desafio-das-esteiras"
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Painel
          </Link>
          <Link
            href="/admin/desafio-das-esteiras/inscritos"
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Inscritos
          </Link>
        </div>
      </header>

      {/* Alternador de modo */}
      <div className="mt-6 flex gap-2">
        {(["manual", "camera"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setModo(m);
              setCameraErro(null);
            }}
            aria-pressed={modo === m}
            className="dst-panel flex-1 px-4 py-3.5"
            style={{
              borderColor: modo === m ? "var(--somma)" : "var(--line)",
              background: modo === m ? "rgba(255,44,4,0.08)" : "var(--ink-2)",
            }}
          >
            <span className="dst-label" style={{ color: modo === m ? "var(--somma)" : undefined }}>
              {m === "manual" ? "Código / busca" : "Ler QR Code"}
            </span>
          </button>
        ))}
      </div>

      {/* Câmera — Safari iOS não tem BarcodeDetector; jsQR lê os frames da câmera. */}
      {modo === "camera" && (
        <>
          <div className="dst-panel relative mt-4 aspect-[3/4] max-h-[62svh] overflow-hidden sm:aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              aria-label="Câmera para leitura do QR Code"
            />
            {/* mira */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[58%] max-w-[280px] -translate-x-1/2 -translate-y-1/2 border-2"
              style={{ borderColor: "var(--somma)", boxShadow: "0 0 0 9999px rgba(8,8,10,0.55)" }}
            />
            {cameraErro && (
              <p className="absolute inset-x-4 bottom-4 bg-[color:var(--ink)] p-4 text-[0.85rem] leading-relaxed">
                {cameraErro}
                <button
                  type="button"
                  onClick={() => setModo("manual")}
                  className="dst-label mt-3 block underline underline-offset-4"
                  style={{ color: "var(--somma)" }}
                >
                  Usar leitura manual →
                </button>
              </p>
            )}
          </div>
          <label className="dst-label mt-4 flex min-h-[44px] cursor-pointer items-center justify-center gap-2 text-[color:var(--somma)] underline underline-offset-4">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={lerFoto}
            />
            Ou tire uma foto do QR
          </label>
        </>
      )}

      {/* Manual */}
      {modo === "manual" && (
        <form onSubmit={procurar} className="mt-4">
          <div className="dst-field-wrap">
            <input
              id="busca"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder=" "
              autoComplete="off"
              autoCapitalize="off"
              className="dst-field"
            />
            <label htmlFor="busca" className="dst-field-label">
              Ticket, nome, CPF ou telefone
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="submit" disabled={ocupado || busca.trim().length < 3} className="dst-btn dst-btn--ghost disabled:opacity-50">
              Procurar
            </button>
            <button
              type="button"
              disabled={ocupado || busca.trim().length < 4}
              onClick={() => validar(busca.trim())}
              className="dst-btn disabled:opacity-50"
            >
              Validar direto
            </button>
          </div>
        </form>
      )}

      {/* Resultado da validação */}
      {resultado && <ResultadoValidacao resultado={resultado} onFechar={() => setResultado(null)} />}

      {/* Resultados da busca */}
      {achados && (
        <section className="mt-7" aria-label="Resultados da busca">
          <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.4)]">
            {achados.length} resultado{achados.length === 1 ? "" : "s"}
          </p>
          <ul className="space-y-3">
            {achados.map((a) => {
              const usado = a.status === "checked_in";
              return (
                <li key={a.id} className="dst-panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="dst-display text-[1.15rem]">{a.full_name}</p>
                      <p className="dst-mono mt-2 text-[0.8rem] opacity-65">
                        {getUnit(a.unit_id)?.nome ?? a.unit_id} · {a.ticket_code}
                      </p>
                      <p className="dst-mono mt-1 text-[0.75rem] opacity-45">
                        {a.cpf_mascarado} · {a.phone_mascarado}
                      </p>
                      <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.4)]">
                        Cadastro: {hora(a.created_at)}
                      </p>
                    </div>
                    <span
                      className="dst-label shrink-0"
                      style={{ color: usado ? "var(--evolve)" : "var(--somma)" }}
                    >
                      {usado ? "JÁ UTILIZADO" : "CONFIRMADO"}
                    </span>
                  </div>

                  {usado ? (
                    <p className="dst-label mt-4 border-t border-[color:var(--line)] pt-4 text-[color:rgba(242,240,236,0.5)]">
                      Validado em {hora(a.checked_in_at)}
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => validar(a.ticket_token)}
                      className="dst-btn mt-4 w-full disabled:opacity-60"
                    >
                      Validar check-in
                    </button>
                  )}
                </li>
              );
            })}
            {!achados.length && (
              <li className="dst-label text-[color:rgba(242,240,236,0.4)]">
                Nada encontrado. Confira o dado digitado — a busca cobre só {escopo}.
              </li>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}

function ResultadoValidacao({
  resultado,
  onFechar,
}: {
  resultado: Resultado;
  onFechar: () => void;
}) {
  const ok = resultado.resultado === "validado";
  const p = resultado.participante;

  const cor =
    ok ? "var(--somma)" : resultado.resultado === "ja_utilizado" ? "var(--evolve)" : "var(--evolve)";

  const titulo = ok
    ? "CHECK-IN REALIZADO"
    : resultado.resultado === "ja_utilizado"
      ? "TICKET JÁ UTILIZADO"
      : resultado.resultado === "unidade_incorreta"
        ? "OUTRA UNIDADE"
        : resultado.resultado === "cancelado"
          ? "TICKET CANCELADO"
          : resultado.resultado === "bloqueado"
            ? "CHECK-IN FECHADO"
            : "TICKET NÃO ENCONTRADO";

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="mt-6 border-2 p-6"
      style={{ borderColor: cor, background: ok ? "rgba(255,44,4,0.08)" : "rgba(224,38,27,0.08)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="dst-display text-[clamp(1.4rem,6vw,2.2rem)]" style={{ color: cor }}>
          {titulo}
        </p>
        <button type="button" onClick={onFechar} className="dst-label shrink-0 underline underline-offset-4">
          Fechar
        </button>
      </div>

      {p && (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">Participante</dt>
            <dd className="dst-display mt-1.5 text-[1.15rem]">{p.full_name}</dd>
          </div>
          <div>
            <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">Unidade</dt>
            <dd className="mt-1.5 text-[0.98rem]">{getUnit(p.unit_id)?.nome ?? p.unit_id}</dd>
          </div>
          <div>
            <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">Ticket</dt>
            <dd className="dst-mono mt-1.5 text-[0.95rem]">{p.ticket_code}</dd>
          </div>
          <div>
            <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">
              {ok ? "Validado em" : "Primeira validação"}
            </dt>
            <dd className="dst-mono mt-1.5 text-[0.95rem]">
              {hora(resultado.checked_in_at ?? p.checked_in_at)}
            </dd>
          </div>
        </dl>
      )}

      {!ok && resultado.error && (
        <p className="mt-5 text-[0.92rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
          {resultado.error}
        </p>
      )}
    </section>
  );
}
