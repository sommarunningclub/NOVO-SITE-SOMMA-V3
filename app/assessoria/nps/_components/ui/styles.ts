/**
 * Classes compartilhadas pelas alternativas. Sem borda e sem sombra: a
 * hierarquia vem de preenchimento, e o estado marcado é a cor da marca.
 *
 * O <input> nativo fica visualmente escondido dentro do <label>, então o foco
 * de teclado é desenhado no label via `has-[:focus-visible]`.
 */
export const opcaoBase =
  "relative flex cursor-pointer select-none rounded-2xl transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#ff2c04] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[#0b0b0c]";

export const opcaoRepouso = "bg-white/[0.06] text-[#f5f5f4] hover:bg-white/[0.1]";

/** Laranja com texto escuro: 5,3:1. Texto branco no mesmo laranja ficaria em 3,7:1. */
export const opcaoMarcada = "bg-[#ff2c04] text-[#0b0b0c]";

/** `scroll-mb-36`: ao receber foco, o campo para acima do rodapé fixo, não atrás dele. */
export const campoTexto =
  "w-full scroll-mb-36 rounded-2xl bg-white/[0.06] px-5 text-[17px] text-[#f5f5f4] placeholder:text-white/45 transition-colors hover:bg-white/[0.08] focus:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2c04] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[#ff6a4d]";
