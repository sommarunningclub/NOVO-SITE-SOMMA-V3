// Helper de classes (evita dependência extra)
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Próximo sábado às 7h (horário de Brasília). Usado no countdown da próxima corrida.
export function nextSaturday7am(now: Date = new Date()): Date {
  const d = new Date(now);
  const day = d.getDay(); // 0=dom ... 6=sáb
  let daysUntil = (6 - day + 7) % 7;
  // Se hoje é sábado e já passou das 7h, vai para o próximo sábado.
  if (daysUntil === 0 && d.getHours() >= 7) daysUntil = 7;
  d.setDate(d.getDate() + daysUntil);
  d.setHours(7, 0, 0, 0);
  return d;
}
