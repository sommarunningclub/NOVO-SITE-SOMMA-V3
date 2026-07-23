/** Links do formulário Treinus por professor (onboarding pós-compra). */
export const PROFESSOR_ONBOARDING_FORMS: Record<
  string,
  { url: string; label: string }
> = {
  "alexandre alves": {
    url: "https://alexandrealves.treinus.com/Public/Form/Index?IdTeam=hCboZ9n3tWY%3d&IdTemplate=inlixzXTcSE%3d",
    label: "Formulário de onboarding do Treinador Alexandre Alves",
  },
  // TODO: preencher quando os links forem confirmados
  "mateus fonseca": {
    url: "",
    label: "Formulário de onboarding do Treinador Mateus Fonseca",
  },
  "joseph pereira": {
    url: "",
    label: "Formulário de onboarding do Treinador Joseph Pereira",
  },
};

function normalizeProfessor(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveProfessorOnboarding(professorNome?: string | null) {
  if (!professorNome) return null;
  const key = normalizeProfessor(professorNome);
  const entry = PROFESSOR_ONBOARDING_FORMS[key];
  if (!entry?.url) return null;
  return entry;
}

export function listProfessorsForPreview(): string[] {
  return Object.keys(PROFESSOR_ONBOARDING_FORMS).map((key) =>
    key.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
