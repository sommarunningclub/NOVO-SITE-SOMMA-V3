"use client";

import type { AnswerKey, Draft, FollowUp, Question } from "@/lib/assessoria-nps/survey";
import { followUpAtivo } from "@/lib/assessoria-nps/logic";
import { NpsScale } from "./ui/NpsScale";
import { RatingScale } from "./ui/RatingScale";
import { SingleChoice } from "./ui/SingleChoice";
import { MultipleChoice } from "./ui/MultipleChoice";
import { OpenText } from "./ui/OpenText";
import { ConditionalQuestion } from "./ui/ConditionalQuestion";

interface QuestionRendererProps {
  pergunta: Question;
  answers: Draft;
  labelledBy: string;
  describedBy?: string;
  campoInvalido: string | null;
  onResponder: (campo: AnswerKey, valor: unknown) => void;
  /** Escolha feita por toque, sem follow-up para abrir: pode seguir sozinha. */
  onEscolhaConcluida: () => void;
}

/** Liga cada tipo de pergunta da configuração ao componente que a desenha. */
export function QuestionRenderer({
  pergunta: q,
  answers,
  labelledBy,
  describedBy,
  campoInvalido,
  onResponder,
  onEscolhaConcluida,
}: QuestionRendererProps) {
  const valor = answers[q.id];

  switch (q.kind) {
    case "scale":
      return (
        <NpsScale
          name={q.id}
          value={valor as number | null | undefined}
          minLabel={q.minLabel}
          maxLabel={q.maxLabel}
          labelledBy={labelledBy}
          describedBy={describedBy}
          onChange={(v, viaPonteiro) => {
            onResponder(q.id, v);
            if (viaPonteiro) onEscolhaConcluida();
          }}
        />
      );

    case "rating":
      return (
        <RatingScale
          name={q.id}
          labels={q.labels}
          value={valor as number | null | undefined}
          labelledBy={labelledBy}
          describedBy={describedBy}
          onChange={(v, viaPonteiro) => {
            onResponder(q.id, v);
            if (viaPonteiro) onEscolhaConcluida();
          }}
        />
      );

    case "single":
      return (
        <SingleChoice
          name={q.id}
          options={q.options}
          value={valor as string | null | undefined}
          labelledBy={labelledBy}
          describedBy={describedBy}
          onChange={(v, viaPonteiro) => {
            onResponder(q.id, v);
            if (viaPonteiro && q.followUp?.when !== v) onEscolhaConcluida();
          }}
        >
          {q.followUp && (
            <ConditionalQuestion show={followUpAtivo(q, answers)}>
              <CampoCondicional followUp={q.followUp} answers={answers} invalido={campoInvalido === q.followUp.field} onResponder={onResponder} />
            </ConditionalQuestion>
          )}
        </SingleChoice>
      );

    case "multi":
      return (
        <MultipleChoice
          name={q.id}
          options={q.options}
          values={(valor as string[] | null | undefined) ?? []}
          labelledBy={labelledBy}
          describedBy={describedBy}
          onChange={(v) => onResponder(q.id, v)}
        >
          {q.followUp && (
            <ConditionalQuestion show={followUpAtivo(q, answers)}>
              <CampoCondicional followUp={q.followUp} answers={answers} invalido={campoInvalido === q.followUp.field} onResponder={onResponder} />
            </ConditionalQuestion>
          )}
        </MultipleChoice>
      );

    case "text":
      return (
        <OpenText
          id={`${q.id}-campo`}
          variant={q.variant}
          value={valor as string | null | undefined}
          maxLength={q.maxLength}
          placeholder={typeof q.placeholder === "function" ? q.placeholder(answers) : q.placeholder}
          labelledBy={labelledBy}
          describedBy={describedBy}
          invalido={campoInvalido === q.id}
          onChange={(v) => onResponder(q.id, v)}
        />
      );
  }
}

function CampoCondicional({
  followUp: f,
  answers,
  invalido,
  onResponder,
}: {
  followUp: FollowUp;
  answers: Draft;
  invalido: boolean;
  onResponder: (campo: AnswerKey, valor: unknown) => void;
}) {
  const rotuloId = `${f.field}-rotulo`;

  return (
    <div>
      <p id={rotuloId} className="mb-3 text-[15px] font-medium text-white/80">
        {f.label}
      </p>
      {f.kind === "text" ? (
        <OpenText
          id={`${f.field}-campo`}
          variant="short"
          value={answers[f.field] as string | null | undefined}
          maxLength={f.maxLength}
          placeholder={f.placeholder}
          labelledBy={rotuloId}
          invalido={invalido}
          autoFocus
          onChange={(v) => onResponder(f.field, v)}
        />
      ) : (
        <MultipleChoice
          name={f.field}
          options={f.options}
          values={(answers[f.field] as string[] | null | undefined) ?? []}
          labelledBy={rotuloId}
          colunas={3}
          onChange={(v) => onResponder(f.field, v)}
        />
      )}
    </div>
  );
}
