'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { tokens } from '@/lib/design-tokens';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Receipt, 
  Plus, 
  History,
  DollarSign,
  Percent,
  Tag,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Types
interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface Payment {
  id: string;
  appointment_id?: string;
  client_name: string;
  amount: number;
  tip: number;
  discount: number;
  discount_reason?: string;
  method: string;
  reference?: string;
  notes?: string;
  created_at: string;
  staff_name?: string;
}

interface PaymentRecordingFormProps {
  salonId: string;
  staffId?: string;
  appointmentId?: string;
  clientName?: string;
  serviceTotal?: number;
  onPaymentRecorded?: () => void;
}

// Payment methods configuration
const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: <Banknote className="h-4 w-4" />, color: 'bg-green-500/20 text-green-300' },
  { id: 'phonepe', name: 'PhonePe', icon: <Smartphone className="h-4 w-4" />, color: 'bg-purple-500/20 text-purple-300' },
  { id: 'upi', name: 'UPI', icon: <Smartphone className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-300' },
  { id: 'card', name: 'Card', icon: <CreditCard className="h-4 w-4" />, color: 'bg-amber-500/20 text-amber-300' }
];

export function PaymentRecordingForm({
  salonId,
  staffId,
  appointmentId,
  clientName,
  serviceTotal = 0,
  onPaymentRecorded
}: PaymentRecordingFormProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(serviceTotal.toString());
  const [tip, setTip] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [discountReason, setDiscountReason] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Update amount when service total changes
  useEffect(() => {
    if (serviceTotal > 0) {
      setAmount(serviceTotal.toString());
    }
  }, [serviceTotal]);

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams({ salon_id: salonId });
      if (staffId) params.append('staff_id', staffId);

      const response = await fetch(`/api/payments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch payment history');

      const data = await response.json();
      setPaymentHistory(data.payments || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Record payment
  const handleRecordPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const paymentData = {
        salon_id: salonId,
        staff_id: staffId,
        appointment_id: appointmentId,
        client_name: clientName,
        amount: parseFloat(amount),
        tip: parseFloat(tip) || 0,
        discount: parseFloat(discount) || 0,
        discount_reason: discountReason || undefined,
        method: selectedMethod,
        reference: reference || undefined,
        notes: notes || undefined
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });

      // Reset form
      setAmount(serviceTotal > 0 ? serviceTotal.toString() : '0');
      setTip('0');
      setDiscount('0');
      setDiscountReason('');
      setReference('');
      setNotes('');

      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate Z-report
  const generateZReport = async () => {
    try {
      const params = new URLSearchParams({
        salon_id: salonId,
        date: new Date().toISOString().split('T')[0]
      });

      const response = await fetch(`/api/payments/z-report?${params}`);
      if (!response.ok) throw new Error('Failed to generate Z-report');

      const data = await response.json();

      // Create and download report
      const reportContent = `
DAILY Z-REPORT
================
Date: ${new Date().toLocaleDateString()}
Salon: ${salonId}

SUMMARY
-------
Total Transactions: ${data.total_transactions || 0}
Total Revenue: ₹${(data.total_revenue || 0).toFixed(2)}
Total Tips: ₹${(data.total_tips || 0).toFixed(2)}
Total Discounts: ₹${(data.total_discounts || 0).toFixed(2)}
Net Revenue: ₹${(data.net_revenue || 0).toFixed(2)}

PAYMENT METHODS
---------------
${(data.method_breakdown || []).map((m: any) => 
        `${m.method}: ₹${m.total.toFixed(2)} (${m.count} transactions)`
      ).join('
')}

TOP SERVICES
------------
${(data.top_services || []).map((s: any, i: number) => 
        `${i + 1}. ${s.service_name}: ₹${s.revenue.toFixed(2)} (${s.count} bookings)`
      ).join('
')}
      `;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `z-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Z-report generated and downloaded'
      });
    } catch (error) {
      console.error('Error generating Z-report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate Z-report',
        variant: 'destructive'
      });
    }
  };

  // Calculate totals
  const subtotal = parseFloat(amount) || 0;
  const tipAmount = parseFloat(tip) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal + tipAmount - discountAmount;

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-gold-400" />
              Record Payment
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchPaymentHistory();
                  setShowHistory(true);
                }}
                className="border-slate-700 text-slate-300"
              >
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateZReport}
                className="border-slate-700 text-slate-300"
              >
                <FileText className="h-4 w-4 mr-1" />
                Z-Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Info */}
          {clientName && (
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400">Client</div>
              <div className="font-medium text-white">{clientName}</div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div>
            <Label className="text-slate-400 text-xs">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PAYMENT_METHODS.map(method => (
                <Button
                  key={method.id}
                  variant="outline"
                  className={`h-auto py-3 flex flex-col items-center gap-2 ${
                    selectedMethod === method.id 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-slate-700 hover:bg-slate-800'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className={`p-2 rounded-full ${method.color}`}>
                    {method.icon}
                  </div>
                  <span className="text-sm">{method.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-400 text-xs">Amount (₹)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-400 text-xs">Tip (₹)</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-400 text-xs">Discount (₹)</Label>
              <div className="relative mt-1">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Discount Reason */}
          {parseFloat(discount) > 0 && (
            <div>
              <Label className="text-slate-400 text-xs">Discount Reason</Label>
              <Input
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="Reason for discount"
              />
            </div>
          )}

          {/* Reference/UTR Field */}
          {(selectedMethod === 'phonepe' || selectedMethod === 'upi' || selectedMethod === 'card') && (
            <div>
              <Label className="text-slate-400 text-xs">Reference/UTR Number</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="Enter transaction reference"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-slate-400 text-xs">Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              placeholder="Additional notes"
            />
          </div>

          {/* Total */}
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400">Tip:</span>
              <span className="font-mono">₹{tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400">Discount:</span>
              <span className="font-mono text-red-400">-₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-700 mt-3 pt-3 flex justify-between items-center">
              <span className="font-semibold text-white">Total:</span>
              <span className="text-xl font-bold text-gold-400">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleRecordPayment}
            className="w-full bg-gold-500 text-slate-950 hover:bg-gold-400 h-12"
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </CardContent>
      </Card>

      {/* Payment History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Payment History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full bg-slate-800" />
                ))}
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payment history found</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {paymentHistory.map(payment => (
                    <div 
                      key={payment.id} 
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-white">{payment.client_name}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            {new Date(payment.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gold-400">₹{payment.amount.toFixed(2)}</div>
                          <Badge className="mt-1 bg-slate-700 text-slate-300">
                            {payment.method.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {(payment.tip > 0 || payment.discount > 0) && (
                        <div className="mt-2 text-sm text-slate-400">
                          {payment.tip > 0 && <span>Tip: ₹{payment.tip.toFixed(2)}</span>}
                          {payment.tip > 0 && payment.discount > 0 && <span> • </span>}
                          {payment.discount > 0 && <span>Discount: ₹{payment.discount.toFixed(2)}</span>}
                        </div>
                      )}

                      {payment.reference && (
                        <div className="mt-2 text-sm text-slate-500">
                          Ref: {payment.reference}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowHistory(false)}
              className="border-slate-700 text-slate-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
