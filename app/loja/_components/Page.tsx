import { MotionRoot } from "./MotionRoot";

/**
 * Casca de toda página da loja.
 *
 * Faz duas coisas: dá o respiro do header fixo (páginas com hero dispensam,
 * porque o hero passa por baixo do header) e liga o movimento.
 *
 * O <MotionRoot /> mora AQUI, e não no layout, de propósito. O Next embrulha a
 * página num Suspense (loading.tsx), que hidrata depois do layout. Se o GSAP
 * mexesse no HTML do servidor antes disso, o React veria um DOM diferente do
 * esperado e jogaria fora o HTML da página para renderizar de novo no cliente.
 * Aqui dentro, o efeito do MotionRoot só roda depois que a página hidratou.
 * Pelo mesmo motivo, não use `data-reveal` dentro de um <Suspense> aninhado.
 */
export function Page({ children, hero = false }: { children: React.ReactNode; hero?: boolean }) {
  return (
    <div className={hero ? undefined : "lj-page"}>
      {children}
      <MotionRoot />
    </div>
  );
}
