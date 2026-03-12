import { useState } from "react";
import PosServiceSelection from "./PosServiceSelection";
import PosCheckout from "./PosCheckout";

interface CartItem {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'product';
}

interface Draft {
  items: CartItem[];
  total: number;
  client: string | null;
}

export default function QuickPOS() {
  const [draft, setDraft] = useState<Draft | null>(null);

  const handleCheckout = (items: CartItem[], total: number, client: string | null) => {
    setDraft({ items, total, client });
  };

  if (!draft) {
    return <PosServiceSelection onCheckout={handleCheckout} />;
  }

  return <PosCheckout items={draft.items} total={draft.total} onComplete={() => setDraft(null)} />;
}
