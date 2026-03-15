import { useState } from "react";
import PosServiceSelection from "./PosServiceSelection";
import PosCheckout from "./PosCheckout";

export default function QuickPOS() {
  const [draft, setDraft] = useState<any>(null);

  const handleCheckout = (items:any[], total:number, client?: string) => {
    setDraft({ items, total, client });
  };

  if (!draft) {
    return <PosServiceSelection onCheckout={handleCheckout} />;
  }

  return <PosCheckout items={draft.items} total={draft.total} onComplete={() => setDraft(null)} />;
}
