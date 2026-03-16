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
  appointmentId?: string;
  clientName?: string;
  serviceTotal?: number;
  onPaymentRecorded?: (payment: Payment) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: <Banknote className="h-5 w-5" />, color: 'bg-green-500/20 text-green-400' },
  { id: 'card', name: 'Card', icon: <CreditCard className="h-5 w-5" />, color: 'bg-blue-500/20 text-blue-400' },
  { id: 'upi', name: 'UPI', icon: <Smartphone className="h-5 w-5" />, color: 'bg-purple-500/20 text-purple-400' },
  { id: 'other', name: 'Other', icon: <Receipt className="h-5 w-5" />, color: 'bg-slate-500/20 text-slate-400' },
];

export function PaymentRecordingForm({
  salonId,
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

  useEffect(() => {
    if (showHistory) {
      fetchPaymentHistory();
    }
  }, [showHistory]);

  const fetchPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ salon_id: salonId });
      if (appointmentId) params.append('appointment_id', appointmentId);

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

  const handleRecordPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        salon_id: salonId,
        appointment_id: appointmentId,
        client_name: clientName,
        amount: parseFloat(amount),
        tip: parseFloat(tip) || 0,
        discount: parseFloat(discount) || 0,
        discount_reason: discountReason,
        method: selectedMethod,
        reference,
        notes
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to record payment');
      }

      const payment = await response.json();

      toast({
        title: 'Payment Recorded',
        description: `Payment of ${amount} recorded successfully`
      });

      // Reset form
      setAmount(serviceTotal.toString());
      setTip('0');
      setDiscount('0');
      setDiscountReason('');
      setReference('');
      setNotes('');

      if (onPaymentRecorded) {
        onPaymentRecorded(payment);
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

  const generateZReport = async () => {
    try {
      const params = new URLSearchParams({
        salon_id: salonId,
        date: new Date().toISOString().split('T')[0]
      });

      const response = await fetch(`/api/payments/z-report?${params}`);
      if (!response.ok) throw new Error('Failed to generate Z-report');

      const data = await response.json();

      // Create and download report using string concatenation
      const methodLines = (data.method_breakdown || []).map((m: { method: string; total: number; count: number }) =>
        m.method + ': \u20B9' + m.total.toFixed(2) + ' (' + m.count + ' transactions)'
      ).join('\n');

      const serviceLines = (data.top_services || []).map((s: { service_name: string; revenue: number; count: number }, i: number) =>
        (i + 1) + '. ' + s.service_name + ': \u20B9' + s.revenue.toFixed(2) + ' (' + s.count + ' bookings)'
      ).join('\n');

      const reportContent =
        'DAILY Z-REPORT\n' +
        '================\n' +
        'Date: ' + new Date().toLocaleDateString() + '\n' +
        'Salon: ' + salonId + '\n\n' +
        'SUMMARY\n' +
        '-------\n' +
        'Total Transactions: ' + (data.total_transactions || 0) + '\n' +
        'Total Revenue: \u20B9' + (data.total_revenue || 0).toFixed(2) + '\n' +
        'Total Tips: \u20B9' + (data.total_tips || 0).toFixed(2) + '\n' +
        'Total Discounts: \u20B9' + (data.total_discounts || 0).toFixed(2) + '\n' +
        'Net Revenue: \u20B9' + (data.net_revenue || 0).toFixed(2) + '\n\n' +
        'PAYMENT METHODS\n' +
        '---------------\n' +
        methodLines + '\n\n' +
        'TOP SERVICES\n' +
        '------------\n' +
        serviceLines;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'z-report-' + new Date().toISOString().split('T')[0] + '.txt';
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
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gold-400" />
            Record Payment
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateZReport}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Z-Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <Label className="text-slate-400 text-xs">Amount (\u20B9)</Label>
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
              <Label className="text-slate-400 text-xs">Tip (\u20B9)</Label>
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
              <Label className="text-slate-400 text-xs">Discount (\u20B9)</Label>
              <div className="relative mt-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
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
              <Select value={discountReason} onValueChange={setDiscountReason}>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="loyalty">Loyalty Discount</SelectItem>
                  <SelectItem value="first-time">First Time Customer</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="staff">Staff Discount</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-xs">Reference (Optional)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="Transaction ID, UPI ref, etc."
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Notes (Optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-mono">\u20B9{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400">Tip:</span>
              <span className="font-mono">\u20B9{tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400">Discount:</span>
              <span className="font-mono text-red-400">-\u20B9{discountAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-700 mt-3 pt-3 flex justify-between items-center">
              <span className="font-semibold text-white">Total:</span>
              <span className="text-xl font-bold text-gold-400">\u20B9{total.toFixed(2)}</span>
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
                          <div className="text-lg font-bold text-gold-400">\u20B9{payment.amount.toFixed(2)}</div>
                          <Badge className="mt-1 bg-slate-700 text-slate-300">
                            {payment.method.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {(payment.tip > 0 || payment.discount > 0) && (
                        <div className="mt-2 text-sm text-slate-400">
                          {payment.tip > 0 && <span>Tip: \u20B9{payment.tip.toFixed(2)}</span>}
                          {payment.tip > 0 && payment.discount > 0 && <span> • </span>}
                          {payment.discount > 0 && <span>Discount: \u20B9{payment.discount.toFixed(2)}</span>}
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
