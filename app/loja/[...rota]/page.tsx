import { notFound } from "next/navigation";

/**
 * Qualquer endereço de /loja que não seja uma rota de verdade cai aqui e vira
 * o 404 da loja (not-found.tsx), dentro do layout dela. Sem isto o Next
 * mostraria o 404 genérico do site.
 *
 * O notFound() sai em generateMetadata para a resposta ter status 404 de
 * verdade: depois que o streaming começa, o status já foi enviado como 200.
 */
export function generateMetadata(): never {
  notFound();
}

export default function RotaDesconhecida(): never {
  notFound();
}
