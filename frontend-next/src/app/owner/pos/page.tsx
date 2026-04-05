'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { ServiceSelection } from '@/components/pos/ServiceSelection';
import { Cart } from '@/components/pos/Cart';
import { PaymentSection } from '@/components/pos/PaymentSection';
import { ReceiptPreview } from '@/components/pos/ReceiptPreview';
import { posApi } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Client, Staff } from '@/types/pos';

export default function POSPage() {
  const { toast } = useToast();
  const { items, client, staff, setClient, setStaff } = useCartStore();
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | undefined>();

  // Fetch clients for selection
  const { data: clients = [] } = useQuery({
    queryKey: ['pos-clients'],
    queryFn: posApi.getClients,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch staff for selection
  const { data: staffList = [] } = useQuery({
    queryKey: ['pos-staff'],
    queryFn: posApi.getStaff,
    staleTime: 5 * 60 * 1000,
  });

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to the cart before checking out.',
        variant: 'destructive',
      });
      return;
    }
    // Scroll to payment section on mobile
    const paymentSection = document.getElementById('payment-section');
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTransactionComplete = (transactionId?: string) => {
    setLastTransactionId(transactionId);
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastTransactionId(undefined);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Point of Sale</h1>
          <p className="text-muted-foreground">Process walk-in sales and manage transactions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Service Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client & Staff Selection */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-select" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Client (Optional)
                  </Label>
                  <Select
                    value={client?.id || ''}
                    onValueChange={(value) => {
                      const selectedClient = clients.find((c: Client) => c.id === value);
                      setClient(selectedClient || null);
                    }}
                  >
                    <SelectTrigger id="client-select">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Walk-in (No Client)</SelectItem>
                      {clients.map((c: Client) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name || c.full_name || 'Client'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-select">Staff Member</Label>
                  <Select
                    value={staff?.id || ''}
                    onValueChange={(value) => {
                      const selectedStaff = staffList.find((s: Staff) => s.id === value);
                      setStaff(selectedStaff || null);
                    }}
                  >
                    <SelectTrigger id="staff-select">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((s: Staff) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Service Selection */}
            <div className="bg-card rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4">Services & Products</h2>
              <ServiceSelection onCheckout={handleCheckout} />
            </div>
          </div>

          {/* Right Column: Cart & Payment */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-card rounded-lg border p-4">
              <Cart onCheckout={handleCheckout} />
            </div>

            {/* Payment Section */}
            <div id="payment-section" className="bg-card rounded-lg border p-4">
              <PaymentSection onComplete={handleTransactionComplete} />
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      <ReceiptPreview
        isOpen={showReceipt}
        onClose={handleCloseReceipt}
        transactionId={lastTransactionId}
      />
    </div>
  );
}
