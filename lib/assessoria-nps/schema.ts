import { z } from "zod";
import {
  EVENING_TIME,
  MESSAGE_VOLUME,
  MORNING_TIME,
  NEEDS_FEEDBACK,
  PERIODS,
  PREFERRED_PERIOD,
  SUNDAY_FREQUENCY,
  WEEKDAY_COMBINATION,
  WEEKDAY_INTEREST,
  WEEKLY_FREQUENCY,
  WHATSAPP_CONTENT,
} from "./survey";

/**
 * Formato do envio (POST /api/assessoria/nps).
 *
 * O zod garante FORMA: tipo, faixa, valor conhecido, tamanho máximo bruto. O
 * que depende de contexto (obrigatória quando exibida, follow-up, pergunta que
 * deve virar NULL) é de `prepararRespostas`, que roda logo depois no servidor.
 * Dividir assim evita duas cópias da lógica condicional.
 */

const nota = (min: number, max: number) => z.number().int().min(min).max(max).nullish();
/** Folga sobre o limite real: o corte exato é feito depois de limpar o texto. */
const texto = (max: number) => z.string().max(max * 2).nullish();

export const answersSchema = z.object({
  nps_score: nota(0, 10),
  nps_reason: texto(2000),
  overall_quality: nota(1, 5),
  expectation_delivery: nota(1, 5),

  teacher_followup: nota(1, 5),
  teacher_understands_goals: nota(1, 5),
  teacher_whatsapp_access: nota(1, 5),
  teacher_support_quality: nota(1, 5),
  teacher_communication_quality: nota(1, 5),

  training_quality: nota(1, 5),
  training_level_fit: nota(1, 5),
  training_goal_alignment: nota(1, 5),
  perceived_progress: nota(1, 5),
  needs_more_feedback: z.enum(NEEDS_FEEDBACK).nullish(),

  whatsapp_group_quality: nota(1, 5),
  whatsapp_connection: nota(1, 5),
  whatsapp_message_volume: z.enum(MESSAGE_VOLUME).nullish(),
  whatsapp_information_clarity: nota(1, 5),
  whatsapp_content_preferences: z.array(z.enum(WHATSAPP_CONTENT)).max(WHATSAPP_CONTENT.length * 2).nullish(),
  whatsapp_content_other: texto(200),

  community_climate: nota(1, 5),
  community_belonging: nota(1, 5),
  community_interaction: nota(1, 5),
  community_one_word: texto(40),

  sunday_frequency: z.enum(SUNDAY_FREQUENCY).nullish(),
  sunday_support_quality: nota(1, 5),
  sunday_value: nota(1, 5),
  sunday_improvements: texto(2000),

  weekday_training_interest: z.enum(WEEKDAY_INTEREST).nullish(),
  preferred_weekday_combination: z.enum(WEEKDAY_COMBINATION).nullish(),
  preferred_weekday_other: texto(200),
  preferred_period: z.enum(PREFERRED_PERIOD).nullish(),
  available_periods: z.array(z.enum(PERIODS)).max(PERIODS.length * 2).nullish(),
  preferred_morning_time: z.enum(MORNING_TIME).nullish(),
  preferred_evening_time: z.enum(EVENING_TIME).nullish(),
  expected_weekly_frequency: z.enum(WEEKLY_FREQUENCY).nullish(),

  physical_structure_quality: nota(1, 5),
  physical_structure_improvements: texto(2000),

  cost_benefit: nota(1, 5),
  renewal_probability: nota(0, 10),

  what_is_excellent: texto(2000),
  what_needs_improvement: texto(2000),
  one_change: texto(2000),
});

const utm = z.string().max(300).optional();

export const envioSchema = z.object({
  campaign: z
    .string()
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Campanha inválida."),
  survey_version: z.string().max(60),
  /** Chave de idempotência, gerada no aparelho quando a pessoa começa. */
  submission_id: z.uuid("Envio inválido."),
  first_name: z.string().max(200),
  last_name: z.string().max(200),
  answers: answersSchema,
  /** Tempo desde o início, medido no aparelho. O servidor ancora no próprio relógio. */
  elapsed_ms: z.number().int().min(0).max(10 * 365 * 24 * 3600 * 1000),
  /** A resposta deve se vincular ao convite do cookie? Falso depois de "responder por outra pessoa". */
  use_invite: z.boolean().optional(),
  attribution: z
    .object({
      source: utm,
      utm_source: utm,
      utm_medium: utm,
      utm_campaign: utm,
    })
    .optional(),
  /** Honeypot: humano nunca preenche. */
  website: z.string().max(500).optional(),
});

export type Envio = z.infer<typeof envioSchema>;
