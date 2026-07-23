# Proteção da rota de e-mail de boas-vindas da assessoria

Data: 2026-07-23

## Problema

`POST /api/assessoria/boas-vindas-email` é pública e sem autenticação. Ela aceita
`nome`, `email`, `plano`, `professor` e `professorWhatsapp` direto do corpo da
requisição e dispara um e-mail pelo Resend com o remetente da Somma. Qualquer
pessoa pode fazer POST e enviar e-mail em nome da marca, com texto arbitrário,
para qualquer destinatário — um vetor de phishing e um risco à reputação do
domínio de envio.

## Princípio da solução

O cliente deixa de dizer *para quem* enviar. Ele apresenta uma prova de compra e
o servidor descobre o destinatário sozinho.

## Contrato novo

```
POST /api/assessoria/boas-vindas-email
{ paymentId: "pay_...", plano: "Semestral", professor: "Alexandre Alves" }
   ou
{ subscriptionId: "sub_...", plano: "Mensal", professor: "Alexandre Alves" }
```

Saem do corpo: `nome`, `email`, `professorWhatsapp`. Todos passam a ser
resolvidos no servidor.

## Validação, em ordem

1. **Id de pagamento** — exatamente um entre `paymentId` e `subscriptionId`.
   Nenhum, ou os dois juntos → `400`.
2. **Prova de pagamento no Asaas**:
   - `paymentId` → `GET /payments/{id}`, exigindo `status ∈ RECEBIDAS`
     (`RECEIVED`, `CONFIRMED`, `RECEIVED_IN_CASH`), o Set já definido em
     `lib/asaas/status.ts`.
   - `subscriptionId` → `GET /subscriptions/{id}`, exigindo `status === "ACTIVE"`.
     Não se exige a primeira parcela confirmada: o Asaas só cria a assinatura
     como ACTIVE se autorizou o cartão, e exigir a confirmação criaria o risco de
     o cliente legítimo não receber o e-mail por latência do gateway.

   Id inexistente ou não pago → `403`.
3. **Destinatário** — do objeto retornado tira-se o `customer`, e
   `GET /customers/{id}` fornece `name` e `email`. É este passo que impede o uso
   da rota para enviar e-mail a terceiros.
4. **Conteúdo** — `plano` validado contra a allowlist `Mensal | Semestral |
   Anual`; `professor` validado contra a tabela Supabase
   `professores_curriculo_assessoria`, de onde também sai o `telefone` usado como
   WhatsApp do treinador. Nenhum texto vindo do cliente entra no corpo do e-mail.
5. **Envio** via `sendAssessoriaBoasVindasEmail`, sem mudanças na lib.

## Erros

| Situação | Status |
|---|---|
| Nenhum id, ou os dois | 400 |
| `plano` fora da allowlist / `professor` desconhecido | 400 |
| Pagamento inexistente, não pago, assinatura não-ACTIVE | 403 |
| `ASAAS_API_KEY` ausente | 500 (fail-closed) |
| Falha do Asaas ou do Supabase | 502 |
| Falha do Resend | 502 |

Fail-closed na ausência da chave do Asaas — o oposto do webhook
(`app/api/webhook/asaas/route.ts`), que segue aberto quando
`ASAAS_WEBHOOK_TOKEN` falta. Lá o objetivo é não perder evento; aqui, não enviar
e-mail sem prova.

Nenhuma resposta ecoa dados do cliente; o motivo real fica só no log do servidor.

## Mudanças no checkout

`components/checkout-form.tsx`: `sendWelcomeEmail` passa a receber o id do
pagamento, e cada fluxo entrega o seu:

- PIX → `pixPaymentId`
- cartão parcelado (Semestral/Anual) → `paymentResult.payment.id`
- cartão recorrente (Mensal) → `paymentResult.subscription.id`

O guard `welcomeEmailSentRef` permanece como está.

## Fora de escopo (deliberado)

Rate limit e idempotência persistida. Depois da validação, o pior caso possível é
alguém de posse de um id de cobrança já paga reenviar o mesmo e-mail ao cliente
legítimo. Não justifica a complexidade agora.

## Verificação

- `scripts/send-assessoria-test.ts` chama a lib direto, não passa pela rota —
  continua servindo para testar o template.
- Rota: id ausente, `plano` inválido, cobrança pendente e cobrança paga real.
