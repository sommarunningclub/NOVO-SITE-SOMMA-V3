import { SignupForm } from "./signup-form";
import { Reveal } from "./reveal";

export function SignupSection() {
  return (
    <section id="inscricao" className="bg-ink py-20 text-white md:py-28">
      <div className="container-somma grid items-center gap-12 md:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Inscrição</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
            Faça parte do Somma Club
          </h2>
          <p className="mt-4 max-w-prose text-base text-white/70 md:text-lg">
            Grátis para sempre. Leva menos de 1 minuto. Preencha o cadastro e apareça no próximo
            encontro de sábado.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <SignupForm />
        </Reveal>
      </div>
    </section>
  );
}
