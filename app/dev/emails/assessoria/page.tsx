import { notFound } from "next/navigation";
import {
  listProfessorsForPreview,
  resolveProfessorOnboarding,
} from "@/lib/emails/assessoria-onboarding";
import { renderAssessoriaBoasVindasEmail } from "@/lib/emails/assessoria-boas-vindas";

export const metadata = {
  title: "Preview — E-mail Assessoria",
  robots: { index: false, follow: false },
};

const SAMPLE = {
  nome: "Maria Fernanda Silva",
  email: "maria@exemplo.com",
  plano: "Semestral",
};

const PROFESSOR_PHONES: Record<string, string> = {
  "Alexandre Alves": "5561999990001",
  "Mateus Fonseca": "5561999990002",
  "Joseph Pereira": "5561999990003",
};

export default async function AssessoriaEmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ professor?: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { professor: selectedProfessor } = await searchParams;
  const professors = listProfessorsForPreview();
  const activeProfessor = selectedProfessor || professors[0] || "Alexandre Alves";

  const html = renderAssessoriaBoasVindasEmail({
    ...SAMPLE,
    professor: activeProfessor,
    professorWhatsapp: PROFESSOR_PHONES[activeProfessor] ?? null,
  });

  const onboarding = resolveProfessorOnboarding(activeProfessor);

  return (
    <div className="min-h-screen bg-zinc-200">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b border-zinc-300 bg-white/95 backdrop-blur px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Dev only</p>
            <h1 className="text-lg font-bold text-zinc-900">Preview — E-mail de boas-vindas Assessoria</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {professors.map((prof) => {
              const hasForm = Boolean(resolveProfessorOnboarding(prof)?.url);
              const isActive = prof === activeProfessor;
              return (
                <a
                  key={prof}
                  href={`/dev/emails/assessoria?professor=${encodeURIComponent(prof)}`}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:border-primary"
                  }`}
                >
                  {prof}
                  {!hasForm && (
                    <span className="ml-1.5 text-xs opacity-70">(sem link)</span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-5xl">
          <p className="text-sm text-zinc-600">
            Professor ativo: <strong>{activeProfessor}</strong>
            {onboarding ? (
              <>
                {" "}
                · Formulário:{" "}
                <a
                  href={onboarding.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Treinus
                </a>
              </>
            ) : (
              " · Link Treinus pendente para este professor"
            )}
          </p>
        </div>
      </div>

      {/* Email preview */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-xl">
          <iframe
            title={`Preview e-mail — ${activeProfessor}`}
            srcDoc={html}
            className="block h-[920px] w-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500">
          Assunto do e-mail: <code>Bem-vindo à Assessoria Somma! Plano {SAMPLE.plano}</code>
        </p>
      </div>
    </div>
  );
}
