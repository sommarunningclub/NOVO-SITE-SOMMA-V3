# Trabalhe Conosco — página de vagas e captação de currículos

**Data:** 2026-08-10
**Rota:** `/trabalhe-conosco-vagas`

## Objetivo

Publicar as vagas abertas da Assessoria Somma Club e captar candidaturas — dados
estruturados + currículo em arquivo — direto no Supabase da gestão, com aviso por
e-mail para o time e confirmação para o candidato.

A primeira vaga é de estagiário(a) de Educação Física.

## Decisões

| Tema | Decisão |
|---|---|
| Currículo | Upload de PDF/DOC (até 5MB) em bucket **privado** do Supabase Storage |
| Fluxo | Modal sobre a própria página (sem rota de candidatura separada) |
| Notificação | E-mail para o time **e** confirmação para o candidato (Resend) |
| Estrutura | Data-driven: `_vagas.ts` com array de vagas; hoje só uma está ativa |
| Bolsa | "A combinar" no anúncio — sem valor público |
| Jornada | Híbrido, com presença obrigatória nos treinos presenciais em Brasília |

## Arquitetura

```
app/trabalhe-conosco-vagas/
  page.tsx              server component · metadata + JSON-LD JobPosting
  _vagas.ts             tipo Vaga + array (fonte única do conteúdo das vagas)
  _vagas-section.tsx    client · lista de cards + UM modal controlado
  _candidatura-form.tsx client · formulário, máscaras, BrasilAPI, upload
app/api/trabalhe-conosco/route.ts   POST multipart → valida → Storage → insert → e-mails
lib/emails/vaga-candidatura.ts      2 templates HTML (time + candidato)
lib/validation.ts                   + vagaCandidaturaSchema e helpers de arquivo
scripts/vagas-migration.sql         tabela, índices, RLS e bucket
```

Segue o padrão já estabelecido em `/seja-parceiro`: componente client faz a
validação com Zod, a rota revalida com o **mesmo schema**, e a escrita usa
`getServiceSupabase()` (service-role, RLS bypass em rota confiável).

## Layout

Herda a linguagem visual de `/assessoria`: header simples com logo e "Voltar ao
site", hero preto com `Hyperspeed`, `container-somma`, cards `rounded-3xl`,
laranja `primary` (#FF2C03), entradas com `<Reveal>` e `<Footer />`.

Seções: Hero → Por que a Somma (foto `/somma/IMG_0888_JPG.jpg` + texto) → Vagas
abertas (cards) → Faixa `bg-ink` de posicionamento → Modal do formulário.

## Formulário

Nome, telefone, e-mail, data de nascimento, CEP (BrasilAPI `cep/v2` preenchendo
logradouro/bairro/cidade/UF em campos travados), complemento (opcional),
instituição, semestre (select 1º–10º), currículo (arquivo), aceite LGPD e
honeypot anti-bot.

## Dados

Tabela `candidatos_vagas` no Supabase da gestão. RLS ligada sem policy para
`anon` — só service-role escreve. Bucket `curriculos` privado; o e-mail do time
recebe **URL assinada** (30 dias), nunca um link público.

Coluna `status` com default `novo` para a triagem futura.

## Degradação

- Supabase ausente/tabela inexistente → 503 explícito, mensagem amigável.
- Falha no upload → candidatura **não** é gravada (o currículo é o ativo principal).
- Falha de e-mail → candidatura permanece salva; erro só no log. Mesma escolha
  que a rota do `/seja-parceiro` faz com o CRM.
- BrasilAPI fora do ar → o candidato preenche o endereço manualmente.
