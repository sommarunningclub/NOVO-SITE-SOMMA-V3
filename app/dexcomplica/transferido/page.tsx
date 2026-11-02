import type { Metadata } from "next";
import { EVENTO_NOME } from "@/lib/dexcomplica-love-run/event.config";
import Transferido from "./Transferido";

export const metadata: Metadata = {
  title: `Ingresso transferido · ${EVENTO_NOME}`,
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function TransferidoPage() {
  return <Transferido />;
}
