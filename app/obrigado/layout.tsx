import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bem-vindo ao SOMMA Club!",
  description: "Inscrição realizada. Entre no grupo do WhatsApp e participe do próximo encontro.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
