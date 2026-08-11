import { Deck } from "./_deck";
import { Gate } from "./_gate";
import { temAcesso } from "./auth";

export const dynamic = "force-dynamic";

export default async function PptSilverCarePage() {
  if (!(await temAcesso())) return <Gate />;
  return <Deck />;
}
