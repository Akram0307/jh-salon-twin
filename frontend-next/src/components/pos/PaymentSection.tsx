'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Banknote, Split, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { posApi } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import type { PaymentMethod } from '@/types/pos';

interface PaymentSectionProps {
  onComplete?: () => void;
}

export function PaymentSection({ onComplete }: PaymentSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { items, client, staff, paymentMethod, tip, subtotal, total, setPaymentMethod, setTip, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Tip options as percentages
  const tipOptions = [0, 0.1, 0.15, 0.2];

  // Payment methods
  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'cash', label: 'Cash', icon: <Banknote className="h-4 w-4" /> },
    { value: 'card', label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'split', label: 'Split', icon: <Split className="h-4 w-4" /> },
  ];

  // Mutation for completing transaction
  const completeTransactionMutation = useMutation({
    mutationFn: posApi.completeTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-recent-transactions'] });
      toast({
        title: 'Transaction completed',
        description: 'The transaction has been recorded successfully.',
      });
      clearCart();
      onComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Transaction failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleTipChange = (percentage: number) => {
    const tipAmount = Math.round(subtotal() * percentage);
    setTip(tipAmount);
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleCompleteTransaction = async () => {
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to the cart before completing the transaction.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    const transactionData = {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        type: item.type,
        quantity: item.quantity || 1,
      })),
      subtotal: subtotal(),
      tip: tip,
      total: total(),
      payment_method: paymentMethod,
      client_id: client?.id,
      staff_id: staff?.id,
    };

    completeTransactionMutation.mutate(transactionData);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {/* Tip Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Tip</h3>
          <div className="grid grid-cols-4 gap-2">
            {tipOptions.map((percentage) => (
              <Button
                key={percentage}
                variant={tip === Math.round(subtotal() * percentage) ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleTipChange(percentage)}
                className="flex flex-col h-auto py-2"
              >
                <span className="text-xs">{percentage * 100}%</span>
                <span className="text-xs">${Math.round(subtotal() * percentage)}</span>
              </Button>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span>Tip amount</span>
            <span>${tip.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Payment Method</h3>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => (
              <Button
                key={method.value}
                variant={paymentMethod === method.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePaymentMethodChange(method.value)}
                className="flex flex-col h-auto py-3"
              >
                {method.icon}
                <span className="mt-1 text-xs">{method.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tip</span>
            <span>${tip.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total().toFixed(2)}</span>
          </div>
        </div>

        {/* Complete Transaction Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleCompleteTransaction}
          disabled={items.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Complete Transaction
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
