import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bem-vindo ao SOMMA Club!",
  description: "Inscrição realizada. Entre no grupo do WhatsApp e participe do próximo encontro.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* O body do site é branco: sem isso, o "quique" do scroll no iOS mostra branco. */}
      <style>{"html,body{background:#0a0a0a}"}</style>
      {children}
    </>
  );
}
