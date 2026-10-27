import Image from "next/image";
import {
  AFTER,
  DATA_CURTA,
  DATA_EXTENSO,
  ESCASSEZ_PUBLICA,
  FESTA,
  HORARIO,
  INSTAGRAM_SOMMA,
  LOCAL_AFTER,
  LOCAL_CORRE,
  MODO_TESTE,
  PERCURSO,
  POLITICA_PRIVACIDADE,
  urlComoChegar,
} from "@/lib/dexcomplica-love-run/event.config";
import { contarInscritos, getEvento } from "@/lib/dexcomplica-love-run/db";
import { estadoDaInscricao, liberado, pelotoesValidos, rotuloPelotao } from "@/lib/dexcomplica-love-run/estado";
import Cabecalho from "./_components/Cabecalho";
import Capa from "./_components/Capa";
import Letreiro from "./_components/Letreiro";
import Revelar from "./_components/Revelar";
import VideoFesta from "./_components/VideoFesta";
import MapaLocais from "./_components/MapaLocais";
import Inscricao from "./_components/Inscricao";
import BarraCta from "./_components/BarraCta";
import TelaSenha from "./_components/TelaSenha";
import { acessoLoveRun } from "@/lib/dexcomplica-love-run/acesso";
import Rastreio from "./_components/Rastreio";
import Marcas from "./_components/Marcas";
import { Pulso } from "./_components/Graficos";
import AdicionarAgenda from "./_components/AdicionarAgenda";
import Interacoes from "./_components/Interacoes";
import Mochila from "./_components/Mochila";
import Letras from "./_components/Letras";

/**
 * Dinâmica: antes da liberação a página depende do cookie da senha. A rota de
 * inscrição confere o estado de novo no banco de qualquer forma.
 */
export const dynamic = "force-dynamic";

const F = "/dexcomplica-love-run/fotos";

export default async function LoveRunPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const evento = await getEvento();
  // Até o Alex liberar (evento oculto no /check-in), só entra quem tem a senha.
  if (!liberado(evento) && !MODO_TESTE && !(await acessoLoveRun.temAcesso())) {
    return <TelaSenha erro={(await searchParams).erro} />;
  }
  const inscritos = evento ? await contarInscritos(evento.id) : 0;
  const { estado } = estadoDaInscricao(evento, inscritos, { teste: MODO_TESTE });
  const pelotoes = pelotoesValidos(evento?.pelotoes);

  return (
    <>
      <Rastreio />
      <Revelar />
      <Interacoes />
      <a href="#inscricao" className="lr-pular">Pular para a inscrição</a>
      <Cabecalho />

      <main id="conteudo">
        <Capa />

        <Letreiro />

        {/* ── A experiência ─────────────────────────────────────────── */}
        <section id="experiencia" className="lr-sec lr-sec--papel" aria-labelledby="t-experiencia">
          <div className="lr-wrap lr-exp">
            <div className="lr-exp__texto">
              <p className="lr-eyebrow" data-revelar>A experiência</p>
              <h2 id="t-experiencia" className="lr-h2" data-revelar>
                Corre no ritmo <span className="lr-marca-texto">do coração.</span>
              </h2>
              <p className="lr-lead" data-revelar>
                Um percurso diferente, muita música e a energia da comunidade Somma em um aquecimento especial para a
                Dexcomplica.
              </p>
              <ol className="lr-lista-exp">
                {[
                  ["Percurso diferente", "Nada do trajeto de sempre. O corre muda de cara."],
                  ["Música e ativações", "Trilha sonora do começo ao fim, com ativações no caminho."],
                  ["Comunidade", "A energia de quem corre junto todo sábado com o Somma."],
                  ["After no Oscarito", "Terminou o corre, a experiência continua."],
                  ["Condição especial na festa", "Para quem estiver presente no corre."],
                ].map(([t, d], i) => (
                  <li key={t} data-revelar>
                    <span className="lr-lista-exp__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <strong>{t}</strong>
                      <span>{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lr-exp__fotos" aria-hidden="false">
              <figure className="lr-foto lr-foto--a" data-parallax="-6" data-tilt="10">
                <Image src={`${F}/corre-trio.jpg`} alt="Três corredores do Somma lado a lado no asfalto do Parque da Cidade" fill sizes="(min-width: 960px) 26vw, 55vw" />
              </figure>
              <figure className="lr-foto lr-foto--b" data-parallax="8" data-tilt="10">
                <Image src={`${F}/corre-aquecimento.jpg`} alt="Aquecimento coletivo do Somma, gente de braços para cima" fill sizes="(min-width: 960px) 22vw, 45vw" />
              </figure>
              <figure className="lr-foto lr-foto--c" data-parallax="-3" data-tilt="10">
                <Image src={`${F}/corre-bandeira.jpg`} alt="Corredora sorrindo com bandeira vermelha na mão" fill sizes="(min-width: 960px) 18vw, 40vw" />
              </figure>
              <button type="button" className="lr-sticker lr-sticker--exp" data-coracao aria-label="Mandar um coração">
                <Image src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" width={180} height={172} data-flutua />
              </button>
            </div>
          </div>
        </section>

        {/* ── O corre ───────────────────────────────────────────────── */}
        <section id="corre" className="lr-sec lr-sec--tinta lr-corre" aria-labelledby="t-corre">
          <div className="lr-corre__foto" aria-hidden="true">
            <Image src={`${F}/corre-pelotao.jpg`} alt="" fill sizes="(min-width: 960px) 45vw, 100vw" data-parallax-img />
          </div>
          <div className="lr-wrap lr-corre__grid">
            <div className="lr-corre__cab">
              <p className="lr-eyebrow lr-eyebrow--claro" data-revelar>O corre</p>
              <p className="lr-data-gigante" data-revelar aria-hidden="true">
                <Letras texto={DATA_CURTA} />
              </p>
              <h2 id="t-corre" className="lr-h2 lr-h2--claro" data-revelar>
                Um corre fora do roteiro.
              </h2>
              <p className="lr-lead lr-lead--claro" data-revelar>
                O encontro é no Estacionamento 1 do Parque da Cidade, e o percurso será diferente do habitual. Você
                escolhe seu pelotão na inscrição.
              </p>
            </div>

            <dl className="lr-peito" data-revelar data-tilt="6">
              <div className="lr-peito__topo" aria-hidden="true">
                <span>LOVE RUN</span>
                <span>Nº {DATA_CURTA}</span>
              </div>
              <div>
                <dt>Encontro</dt>
                <dd>{LOCAL_CORRE.nome}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{DATA_EXTENSO}</dd>
              </div>
              <div>
                <dt>Concentração</dt>
                <dd>{HORARIO.concentracao ?? <span className="lr-embreve">Em breve</span>}</dd>
              </div>
              <div>
                <dt>Largada</dt>
                <dd>{HORARIO.largada ?? <span className="lr-embreve">Em breve</span>}</dd>
              </div>
              <div className="lr-peito__largo">
                <dt>Pelotões</dt>
                <dd>
                  {pelotoes.length > 0 ? (
                    <ul className="lr-chips">
                      {pelotoes.map((p) => (
                        <li key={p}>{rotuloPelotao(p)}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="lr-embreve">Em breve</span>
                  )}
                </dd>
              </div>
              <div className="lr-peito__largo">
                <dt>Percurso</dt>
                <dd>{PERCURSO ? PERCURSO.descricao : <>Diferente do habitual. <span className="lr-embreve">Traçado oficial em breve</span></>}</dd>
              </div>
            </dl>

            {PERCURSO ? (
              <figure className="lr-percurso" data-revelar>
                <Image src={PERCURSO.imagem} alt={PERCURSO.alt} width={1200} height={900} sizes="(min-width: 960px) 50vw, 100vw" />
              </figure>
            ) : null}

            <div className="lr-corre__acoes" data-revelar>
              <a href="#inscricao" className="lr-btn lr-btn--vermelho" data-rastrear="cta:corre">
                Quero garantir minha vaga
              </a>
              <AdicionarAgenda origem="corre" />
            </div>
          </div>
        </section>

        {/* ── After no Oscarito ─────────────────────────────────────── */}
        <section id="after" className="lr-sec lr-sec--amarelo" aria-labelledby="t-after">
          <div className="lr-wrap lr-after">
            <div className="lr-after__texto">
              <p className="lr-eyebrow" data-revelar>Depois do corre · {LOCAL_AFTER.nome}</p>
              <h2 id="t-after" className="lr-h2" data-revelar>
                Terminou o corre? <br />
                A experiência continua.
              </h2>
              <p className="lr-lead" data-revelar>
                Depois do corre, o after é no Oscarito. Aproveite a estrutura esportiva, curta o after e venha preparado
                para ficar com a gente.
              </p>
              <ul className="lr-after__tags" data-revelar>
                {["Estrutura esportiva", ...AFTER.estrutura, ...AFTER.modalidades, "After"].map((t) => (
                  <li key={t} data-tag>{t}</li>
                ))}
              </ul>
              <p className="lr-nota" data-revelar>
                {AFTER.acesso ?? "Horário do after, condições de acesso e modalidades liberadas no dia serão divulgados em breve."}
                {AFTER.horario ? ` After: ${AFTER.horario}.` : ""}
              </p>
              <a
                className="lr-link-seta"
                href={urlComoChegar(LOCAL_AFTER)}
                target="_blank"
                rel="noopener noreferrer"
                data-rastrear="como_chegar:after"
                data-revelar
              >
                Como chegar ao Oscarito
              </a>
            </div>

            <Mochila />
          </div>
        </section>

        {/* ── A festa ───────────────────────────────────────────────── */}
        <section id="festa" className="lr-sec lr-sec--vermelho lr-festa" aria-labelledby="t-festa">
          <div className="lr-wrap lr-festa__grid">
            <div className="lr-festa__midia">
              <VideoFesta />
              <figure className="lr-polaroid lr-polaroid--1" data-parallax="10" data-arrasta>
                <Image src={`${F}/dex-mascote-abraco.jpg`} alt="O mascote de coração da Dexcomplica abraçado a uma convidada na festa" width={360} height={540} sizes="180px" />
              </figure>
              <figure className="lr-polaroid lr-polaroid--2" data-parallax="-8" data-arrasta>
                <Image src={`${F}/dex-adesivo.jpg`} alt="Convidada da festa Dexcomplica segurando um adesivo de coração" width={360} height={540} sizes="160px" />
              </figure>
            </div>
            <div className="lr-festa__texto">
              <Image
                className="lr-festa__logo"
                src="/dexcomplica-love-run/marca/dex-logo.png"
                alt="Dexcomplica"
                width={900}
                height={194}
                data-revelar
              />
              <h2 id="t-festa" className="lr-h2 lr-h2--claro" data-revelar>
                O Love Run é só o começo.
              </h2>
              <p className="lr-lead lr-lead--claro" data-revelar>
                Quem estiver presente no corre terá acesso a uma condição especial para a festa Dexcomplica.
                {FESTA.confirmada ? ` A festa é dia ${FESTA.data}${FESTA.local ? `, em ${FESTA.local}` : ""}.` : ""}
              </p>
              <p className="lr-nota lr-nota--claro" data-revelar>
                {FESTA.beneficio ??
                  "Os detalhes do benefício serão informados em breve. Ele vale para quem estiver presente no corre: a inscrição, sozinha, não garante a condição."}
              </p>
              <a
                className="lr-btn lr-btn--branco"
                href={FESTA.url ?? FESTA.instagram}
                target="_blank"
                rel="noopener noreferrer"
                data-rastrear="festa_saiba_mais"
                data-revelar
              >
                {FESTA.url ? "Saiba mais sobre a festa" : "Acompanhe a Dexcomplica"}
              </a>
            </div>
          </div>
        </section>

        {/* ── Localização ───────────────────────────────────────────── */}
        <section id="local" className="lr-sec lr-sec--papel" aria-labelledby="t-local">
          <div className="lr-wrap">
            <p className="lr-eyebrow" data-revelar>Localização</p>
            <h2 id="t-local" className="lr-h2" data-revelar>
              Do Estacionamento 1 ao Oscarito.
            </h2>
            <MapaLocais />
          </div>
        </section>

        {/* ── Inscrição ─────────────────────────────────────────────── */}
        <section id="inscricao" className="lr-sec lr-sec--tinta lr-insc" aria-labelledby="t-inscricao">
          <Pulso className="lr-insc__pulso" />
          <div className="lr-wrap lr-insc__grid">
            <div className="lr-insc__cab">
              <p className="lr-eyebrow lr-eyebrow--claro" data-revelar>Inscrição</p>
              <h2 id="t-inscricao" className="lr-h2 lr-h2--claro" data-revelar>
                Garanta sua vaga.
              </h2>
              <p className="lr-lead lr-lead--claro" data-revelar>
                Gratuito. {ESCASSEZ_PUBLICA}. Seu ingresso com QR Code sai na hora, na tela e no seu e-mail.
              </p>
              <ul className="lr-insc__fatos" data-revelar>
                <li>{DATA_EXTENSO}</li>
                <li>{LOCAL_CORRE.nome}</li>
              </ul>
            </div>
            <Inscricao estado={estado} pelotoes={pelotoes.map((p) => ({ valor: p, rotulo: rotuloPelotao(p) }))} />
          </div>
        </section>

        {/* ── Perguntas ─────────────────────────────────────────────── */}
        <section id="duvidas" className="lr-sec lr-sec--papel" aria-labelledby="t-duvidas">
          <div className="lr-wrap lr-faq">
            <h2 id="t-duvidas" className="lr-h2" data-revelar>
              Dúvidas rápidas
            </h2>
            <div className="lr-faq__lista">
              {[
                ["A inscrição é paga?", "Não. A inscrição é gratuita, mas as vagas são limitadas."],
                [
                  "Onde fica meu ingresso?",
                  "Ele aparece na tela assim que a inscrição é confirmada e também vai para o seu e-mail. Perdeu? Use “Recuperar meu ingresso” na inscrição: enviamos de novo para o e-mail cadastrado.",
                ],
                ["Qual é o horário?", "Vamos divulgar aqui e no @somma.club assim que estiver confirmado."],
                [
                  "Como funciona a condição especial da festa?",
                  "Ela é para quem estiver presente no corre. Percentual, regras e forma de entrega serão informados em breve.",
                ],
                ["O que levar para o after?", "Roupa de banho e uma segunda roupa: o Oscarito tem ducha e vestiários."],
              ].map(([p, r]) => (
                <details key={p} className="lr-faq__item" data-revelar>
                  <summary>{p}</summary>
                  <p>{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="lr-rodape">
        <div className="lr-wrap lr-rodape__grid">
          <Marcas tom="claro" />
          <p className="lr-rodape__bordao">Desapega, desilude... Dexcomplica!</p>
          <nav aria-label="Links do rodapé" className="lr-rodape__links">
            <a href={INSTAGRAM_SOMMA} target="_blank" rel="noopener noreferrer">@somma.club</a>
            <a href={FESTA.instagram} target="_blank" rel="noopener noreferrer">@dexxcomplica</a>
            <a href={POLITICA_PRIVACIDADE}>Política de privacidade</a>
          </nav>
          <p className="lr-rodape__legal">Realização Somma Club e Dexcomplica · Produção Monu · Brasília, DF</p>
        </div>
      </footer>

      <BarraCta estado={estado} />
    </>
  );
}
