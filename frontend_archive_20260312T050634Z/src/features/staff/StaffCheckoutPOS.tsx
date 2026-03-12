import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useCheckout } from './hooks/useCheckout';
import { Button } from '../../components/ui/button';
import { glass, semantic, component } from '../../lib/design-tokens';

export const StaffCheckoutPOS: React.FC = () => {
  const { checkoutState, processPayment } = useCheckout();
  const items = [{ id: '1', name: 'Haircut', price: 50 }, { id: '2', name: 'Shampoo', price: 20 }];
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <GlassCard className="p-6 text-white shadow-2xl">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
      <div className="space-y-4 mb-8">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-zinc-300">{item.name}</span>
            <span className="font-mono">{item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t semantic.border.default pt-4 flex justify-between items-center text-xl font-bold">
          <span>Total</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>
      <Button
        onClick={() => processPayment.mutate({ items, total })}
        disabled={processPayment.isPending}
        className="w-full py-6 rounded-[20px] font-semibold"
      >
        {processPayment.isPending ? 'Processing...' : 'Confirm Payment'}
      </Button>
    </GlassCard>
  );
};
