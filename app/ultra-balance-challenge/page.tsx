"use client";

import {
  C,
  RESUMO_CARDS,
  PORQUE_BLOCOS,
  JORNADA,
  CAMPOS_CADASTRO,
  PERFIS,
  DASHBOARD_LEGENDAS,
  PILARES,
  FLUXO_VALIDACAO,
  RANKING_TIPOS,
  FLUXO_MAQUINA,
  MARCA_RECEBE,
  ENTIDADES,
  MVP,
  FUTURO,
  INDICADORES,
  NUMEROS_FINAIS,
} from "./data";
import {
  Icon,
  Reveal,
  ReadingProgress,
  Section,
  SectionHeader,
  MetricCard,
  Highlight,
  FakeDataNote,
} from "./_components/base";
import {
  DashboardMockup,
  SignupMockup,
  MissionOfDayMockup,
  ShareCardMockup,
  PhotoMachineMockup,
  OutputCardMockup,
  BrandDashboardMockup,
} from "./_components/mockups";
import {
  Hero,
  FinalCTA,
  Timeline,
  EngagementChart,
  FlowDiagram,
  ChainFlow,
  MissionCard,
  ValidationTable,
  ScoreWeights,
  PointsTable,
  RankingTable,
  RewardProgress,
  BadgeRow,
  TechnologyTable,
} from "./_components/blocks";

export default function UltraBalanceChallengePage() {
  return (
    <main className="bg-white">
      <ReadingProgress />

      {/* ─── 1 · HERO ─────────────────────────────────────────────────── */}
      <Hero />

      {/* ─── 2 · RESUMO EXECUTIVO ─────────────────────────────────────── */}
      <Section id="como-funciona" tone="white">
        <SectionHeader
          eyebrow="Resumo executivo"
          title={<>O que é o Ultra Balance Challenge?</>}
          text={
            <>
              <p>
                O Ultra Balance Challenge é um passaporte digital de 21 dias que conecta a comunidade do Somma à
                campanha Michelob Ultra Social Run antes mesmo do evento presencial.
              </p>
              <p className="mt-4">
                O participante recebe missões relacionadas a movimento, conexão e diversão, acumula pontos, compete
                individualmente ou por crew e desbloqueia benefícios para a experiência final.
              </p>
            </>
          }
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RESUMO_CARDS.map((c, i) => (
            <Reveal as="li" key={c.title} delay={i * 0.06} className="h-full">
              <MetricCard icon={c.icon} title={c.title} text={c.text} />
            </Reveal>
          ))}
        </ul>
        <div className="mt-12">
          <Highlight>A campanha não acontece apenas no dia do evento. Ela começa três semanas antes.</Highlight>
        </div>
      </Section>

      {/* ─── 3 · POR QUE 21 DIAS ──────────────────────────────────────── */}
      <Section tone="light">
        <SectionHeader eyebrow="Duração" title="Por que uma jornada de 21 dias?" />
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {PORQUE_BLOCOS.map((b, i) => (
            <Reveal as="li" key={b.title} delay={i * 0.07} className="h-full">
              <MetricCard icon={b.icon} title={b.title} text={b.text} color={[C.navy, C.orange, C.red][i]} />
            </Reveal>
          ))}
        </ul>

        <h3 className="mt-16 font-title text-xl font-bold uppercase tracking-tight text-[#0E1226] md:text-2xl">
          Como os 21 dias se organizam
        </h3>
        <div className="mt-8">
          <Timeline />
        </div>

        <div className="mt-16 rounded-2xl border border-black/[0.07] bg-white p-5 md:p-8">
          <h3 className="font-title text-lg font-bold uppercase tracking-tight text-[#0E1226] md:text-xl">
            Engajamento ao longo do desafio
          </h3>
          <p className="mt-1.5 text-sm text-[#5A6178]">
            A pontuação acumulada e as recompensas por faixa sustentam a curva até o dia do evento.
          </p>
          <div className="mt-6">
            <EngagementChart />
          </div>
        </div>
      </Section>

      {/* ─── 4 · JORNADA ──────────────────────────────────────────────── */}
      <Section id="jornada" tone="navy">
        <SectionHeader
          eyebrow="Jornada do participante"
          title="Do cadastro à experiência presencial"
          onDark
          text="A experiência precisa ser simples, mobile first e acessível por navegador, sem exigir o download de um aplicativo."
        />
        <div className="mt-12">
          <FlowDiagram steps={JORNADA} onDark numbered />
        </div>
      </Section>

      {/* ─── 5 · CADASTRO E PERFIL ────────────────────────────────────── */}
      <Section tone="white">
        <SectionHeader eyebrow="Cadastro" title="Cada participante começa escolhendo seu ritmo" />
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          <Reveal className="flex justify-center">
            <SignupMockup campos={CAMPOS_CADASTRO} />
          </Reveal>
          <div>
            <h3 className="font-title text-lg font-bold uppercase tracking-tight text-[#0E1226]">
              O que é pedido no cadastro
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {CAMPOS_CADASTRO.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-black/[0.09] px-3.5 py-1.5 text-sm text-[#0E1226]"
                >
                  {c}
                </li>
              ))}
            </ul>

            <h3 className="mt-10 font-title text-lg font-bold uppercase tracking-tight text-[#0E1226]">
              E qual perfil ele escolhe
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {PERFIS.map((p, i) => (
                <Reveal as="li" key={p.title} delay={i * 0.05} className="h-full">
                  <div className="h-full rounded-2xl border-l-4 bg-[#F4F5F8] p-4" style={{ borderColor: p.color }}>
                    <h4 className="font-title text-lg font-bold uppercase tracking-tight" style={{ color: p.color }}>
                      {p.title}
                    </h4>
                    <p className="mt-1 text-sm leading-snug text-[#5A6178]">{p.text}</p>
                  </div>
                </Reveal>
              ))}
            </ul>

            <div className="mt-8">
              <Highlight>O perfil escolhido ajuda a personalizar missões, conteúdos e crews.</Highlight>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 6 · DASHBOARD DO PARTICIPANTE ────────────────────────────── */}
      <Section tone="light">
        <SectionHeader
          eyebrow="Dashboard"
          title="Um passaporte digital de 21 dias"
          text="Tudo o que o participante precisa numa tela só: onde ele está, o que falta e o que vem depois."
        />
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          <Reveal className="flex justify-center">
            <DashboardMockup />
          </Reveal>
          <div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {DASHBOARD_LEGENDAS.map((l, i) => (
                <Reveal as="li" key={l.title} delay={i * 0.05} className="h-full">
                  <div className="flex h-full gap-3 rounded-2xl border border-black/[0.07] bg-white p-4">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-title text-[11px] font-bold"
                      style={{ backgroundColor: `${C.navy}12`, color: C.navy }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-title text-base font-semibold uppercase tracking-tight text-[#0E1226]">
                        {l.title}
                      </h3>
                      <p className="mt-1 text-sm leading-snug text-[#5A6178]">{l.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["15 de 21", "dias concluídos"],
                ["750", "pontos"],
                ["6 dias", "sequência atual"],
                ["12º", "lugar geral"],
                ["3º", "na Social Crew"],
                ["100 pts", "para a próxima recompensa"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-white px-4 py-3 ring-1 ring-black/[0.06]">
                  <dt className="sr-only">{l}</dt>
                  <dd>
                    <span className="block font-title text-xl font-bold text-[#0E1226]">{v}</span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-[#5A6178]">{l}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <FakeDataNote />
          </div>
        </div>
      </Section>

      {/* ─── 7 · MISSÕES ──────────────────────────────────────────────── */}
      <Section tone="white">
        <SectionHeader eyebrow="Missões" title="Três pilares. Diferentes formas de participar." />
        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {PILARES.map((p, i) => (
            <Reveal as="li" key={p.key} delay={i * 0.07} className="h-full">
              <MissionCard title={p.title} icon={p.icon} color={p.color} missoes={p.missoes} />
            </Reveal>
          ))}
        </ul>

        <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-14">
          <div>
            <h3 className="font-title text-xl font-bold uppercase tracking-tight text-[#0E1226] md:text-2xl">
              Como uma missão chega ao participante
            </h3>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#5A6178]">
              Uma missão por dia, com o valor em pontos visível antes de começar e um único botão para comprovar. Sem
              formulário longo, sem fricção.
            </p>
          </div>
          <Reveal className="w-full max-w-sm lg:w-[360px]">
            <MissionOfDayMockup />
          </Reveal>
        </div>
      </Section>

      {/* ─── 8 · VALIDAÇÃO ────────────────────────────────────────────── */}
      <Section tone="light">
        <SectionHeader eyebrow="Comprovação" title="Validação simples, flexível e segura" />
        <div className="mt-10">
          <ValidationTable />
        </div>

        <div className="mt-10 rounded-2xl border-l-4 bg-white p-5 md:p-6" style={{ borderColor: C.navy }}>
          <p className="font-title text-lg font-semibold uppercase leading-snug tracking-tight text-[#0E1226] md:text-xl">
            O MVP não depende de Garmin ou Strava.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#5A6178]">
            A primeira versão pode funcionar com QR Code, upload, indicação e autodeclaração, o que tira dependência de
            terceiros do caminho crítico.
          </p>
        </div>

        <h3 className="mt-14 font-title text-lg font-bold uppercase tracking-tight text-[#0E1226] md:text-xl">
          Da missão ao ranking
        </h3>
        <div className="mt-5">
          <ChainFlow items={FLUXO_VALIDACAO} />
        </div>
      </Section>

      {/* ─── 9 · PONTUAÇÃO ────────────────────────────────────────────── */}
      <Section tone="white">
        <SectionHeader
          eyebrow="Pontuação"
          title="A competição valoriza consistência, não apenas velocidade"
        />
        {/* min-w-0: sem isso o item de grid herda min-width:auto e a tabela
            larga estica a coluna em vez de rolar dentro dela */}
        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <h3 className="font-title text-lg font-bold uppercase tracking-tight text-[#0E1226]">
              Como o peso é distribuído
            </h3>
            <div className="mt-6">
              <ScoreWeights />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-title text-lg font-bold uppercase tracking-tight text-[#0E1226]">
              Exemplos de pontuação
            </h3>
            <div className="mt-6">
              <PointsTable />
            </div>
          </div>
        </div>
        <div className="mt-12">
          <Highlight>
            Um corredor iniciante pode competir com um corredor avançado porque o sistema premia participação,
            regularidade e comunidade.
          </Highlight>
        </div>
      </Section>

      {/* ─── 10 · RANKINGS ────────────────────────────────────────────── */}
      <Section tone="light">
        <SectionHeader eyebrow="Rankings" title="Mais de uma forma de vencer" />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RANKING_TIPOS.map((r, i) => (
            <Reveal as="li" key={r.title} delay={i * 0.06} className="h-full">
              <MetricCard
                icon={r.icon}
                title={r.title}
                text={r.text}
                color={[C.navy, C.orange, C.green, C.red][i]}
              />
            </Reveal>
          ))}
        </ul>
        <div className="mt-12">
          <RankingTable />
        </div>
      </Section>

      {/* ─── 11 · RECOMPENSAS ─────────────────────────────────────────── */}
      <Section tone="navy">
        <SectionHeader
          eyebrow="Recompensas"
          title="Progresso digital que desbloqueia experiências reais"
          onDark
        />
        <div className="mt-12">
          <RewardProgress />
        </div>

        <h3 className="mt-16 font-title text-lg font-bold uppercase tracking-tight text-white md:text-xl">
          Badges conquistados no caminho
        </h3>
        <div className="mt-6">
          <BadgeRow />
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <h3 className="font-title text-lg font-bold uppercase tracking-tight text-white md:text-xl">
              E um card para compartilhar
            </h3>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/65">
              Cada conquista gera uma peça pronta para as redes, com o perfil, a crew e a pontuação do participante. É
              o conteúdo da campanha sendo produzido pela própria comunidade.
            </p>
          </div>
          <Reveal className="flex justify-center lg:justify-end">
            <ShareCardMockup />
          </Reveal>
        </div>
      </Section>

      {/* ─── 12 · MÁQUINA DE FOTOS ────────────────────────────────────── */}
      <Section tone="white">
        <SectionHeader
          eyebrow="Integração presencial"
          title="O desafio termina em uma experiência personalizada"
          text="O QR Code pessoal liga o que a pessoa fez em 21 dias ao que ela leva para casa no dia do evento."
        />
        <div className="mt-12">
          <FlowDiagram steps={FLUXO_MAQUINA} numbered />
        </div>

        <div className="mt-16 grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="font-title text-lg font-bold uppercase tracking-tight text-[#0E1226] md:text-xl">
              A máquina
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5A6178]">
              Câmera, iluminação frontal, tela vertical e leitor de QR Code, com a identidade das duas marcas aplicada
              da testeira à base.
            </p>
            <div className="mt-8">
              <PhotoMachineMockup />
            </div>
          </div>
          <div>
            <h3 className="font-title text-lg font-bold uppercase tracking-tight text-[#0E1226] md:text-xl">
              O card de saída
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#5A6178]">
              A arte já sai preenchida com os dados do participante, porque o sistema reconhece quem escaneou.
            </p>
            <Reveal className="mt-8 flex justify-center lg:justify-start">
              <OutputCardMockup />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ─── 13 · PAINEL DA MARCA ─────────────────────────────────────── */}
      <Section tone="light">
        <SectionHeader
          eyebrow="Painel"
          title="Dados em tempo real para Somma e Michelob Ultra"
          text="Um painel único, aberto para as duas marcas durante toda a campanha, não só no relatório final."
        />
        <Reveal className="mt-12">
          <BrandDashboardMockup />
        </Reveal>
        <FakeDataNote />
      </Section>

      {/* ─── 14 · O QUE A MARCA RECEBE ────────────────────────────────── */}
      <Section tone="navy">
        <SectionHeader eyebrow="Entrega" title="Muito mais que participação" onDark />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {MARCA_RECEBE.map((m, i) => (
            <Reveal as="li" key={m.title} delay={i * 0.06} className="h-full">
              <MetricCard icon={m.icon} title={m.title} text={m.text} onDark color={C.orange} />
            </Reveal>
          ))}
        </ul>
        <div className="mt-12">
          <Highlight onDark>
            O desafio transforma uma ativação pontual em uma jornada de relacionamento mensurável.
          </Highlight>
        </div>
      </Section>

      {/* ─── 15 · ARQUITETURA ─────────────────────────────────────────── */}
      <Section tone="white">
        <SectionHeader
          eyebrow="Tecnologia"
          title="Uma estrutura simples, escalável e integrada ao Somma"
          text="A mesma base que já roda os produtos digitais do Somma, o que encurta prazo e reduz risco de implementação."
        />
        <Reveal className="mt-12 rounded-2xl bg-[#F4F5F8] p-5 md:p-8">
          <ChainFlow
            items={[
              "Participante",
              "Next.js",
              "Vercel",
              "Supabase",
              "Resend e WhatsApp",
              "Painel e máquina de fotos",
            ]}
          />
        </Reveal>
        <div className="mt-10">
          <TechnologyTable />
        </div>
      </Section>

      {/* ─── 16 · MODELO DE DADOS ─────────────────────────────────────── */}
      <Section tone="light">
        <SectionHeader
          eyebrow="Modelo de dados"
          title="O que o sistema precisa registrar"
          text="As entidades principais e como elas se ligam, sem entrar em implementação."
        />
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ENTIDADES.map((e, i) => (
            <Reveal as="li" key={e.name} delay={i * 0.04}>
              <div className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-4 py-3.5">
                <Icon name="Database" className="h-4 w-4 shrink-0" color={C.navy} />
                <span className="font-title text-base font-semibold uppercase tracking-tight text-[#0E1226]">
                  {e.name}
                </span>
                <span className="ml-auto text-right text-[11px] leading-tight text-[#5A6178]">{e.liga}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ─── 17 · MVP ─────────────────────────────────────────────────── */}
      <Section tone="white">
        <SectionHeader eyebrow="Escopo" title="Primeira versão para validar o conceito" />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border-2 p-6 md:p-7" style={{ borderColor: C.navy }}>
              <h3 className="font-title text-xl font-bold uppercase tracking-tight" style={{ color: C.navy }}>
                Entra no MVP
              </h3>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {MVP.map((m) => (
                  <li key={m} className="flex items-start gap-2.5 text-sm text-[#0E1226]">
                    <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0" color={C.navy} />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full rounded-2xl border border-black/[0.09] bg-[#F4F5F8] p-6 md:p-7">
              <h3 className="font-title text-xl font-bold uppercase tracking-tight text-[#5A6178]">
                Evolução futura
              </h3>
              <ul className="mt-5 grid gap-2.5">
                {FUTURO.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#5A6178]">
                    <Icon name="ArrowUpRight" className="mt-0.5 h-4 w-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
        <div className="mt-12">
          <Highlight>A primeira versão deve priorizar simplicidade, adesão e mensuração.</Highlight>
        </div>
      </Section>

      {/* ─── 18 · INDICADORES ─────────────────────────────────────────── */}
      <Section tone="light">
        <SectionHeader eyebrow="Resultado" title="Como avaliar o resultado" />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDICADORES.map((cat, i) => (
            <Reveal as="li" key={cat.categoria} delay={i * 0.06} className="h-full">
              <div className="h-full rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6">
                <h3
                  className="font-title text-lg font-bold uppercase tracking-tight"
                  style={{ color: [C.navy, C.orange, C.red, C.green, C.navy][i] }}
                >
                  {cat.categoria}
                </h3>
                <ul className="mt-4 space-y-2">
                  {cat.itens.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-[#5A6178]">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: [C.navy, C.orange, C.red, C.green, C.navy][i] }}
                        aria-hidden
                      />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ─── 19 · RESUMO FINAL ────────────────────────────────────────── */}
      <Section tone="white">
        <SectionHeader eyebrow="Em uma frase" title="O que é, resumido" center />
        <Reveal delay={0.06}>
          <p className="mx-auto mt-8 max-w-3xl text-center font-title text-xl font-medium uppercase leading-snug tracking-tight text-[#0E1226] md:text-3xl">
            O Ultra Balance Challenge é uma plataforma digital de 21 dias que conecta movimento, comunidade e diversão,
            criando <span style={{ color: C.red }}>engajamento mensurável</span> antes do Michelob Ultra Social Run.
          </p>
        </Reveal>
        <ul className="mt-14 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {NUMEROS_FINAIS.map((n, i) => (
            <Reveal as="li" key={n.label} delay={i * 0.07} className="text-center">
              <p
                className="font-title text-5xl font-bold leading-none md:text-6xl"
                style={{ color: [C.navy, C.orange, C.green, C.red][i] }}
              >
                {n.value}
              </p>
              <p className="mt-2 text-sm text-[#5A6178]">{n.label}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ─── 20 · CTA FINAL ───────────────────────────────────────────── */}
      <FinalCTA />
    </main>
  );
}
