import { sendAssessoriaBoasVindasEmail } from "../lib/emails/assessoria-boas-vindas";

async function main() {
  const email = process.argv[2] ?? "alexandrealvesedf@gmail.com";

  const result = await sendAssessoriaBoasVindasEmail({
    nome: "Alexandre",
    email,
    plano: "Semestral",
    professor: "Alexandre Alves",
    professorWhatsapp: "5561999990001",
  });

  if (!result.ok) {
    console.error("ERROR:", result.error);
    process.exit(1);
  }

  console.log("SUCCESS id:", result.id);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
