'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Calendar, DollarSign, FileText, Loader2 } from 'lucide-react';

interface BillingInfo {
  plan: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  paymentMethod: {
    type: 'card';
    last4: string;
    brand: string;
    expiry: string;
  };
}

interface BillingSectionProps {
  billingInfo?: BillingInfo;
  onChangePlan?: () => void;
  onUpdatePayment?: () => void;
  onDownloadInvoice?: (invoiceId: string) => void;
}

export function BillingSection({ 
  billingInfo, 
  onChangePlan, 
  onUpdatePayment, 
  onDownloadInvoice 
}: BillingSectionProps) {
  const [loading, setLoading] = useState(false);

  const handleDownloadInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      if (onDownloadInvoice) {
        await onDownloadInvoice(invoiceId);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock invoice data
  const invoices = [
    { id: 'INV-001', date: '2026-03-01', amount: 99.00, status: 'paid' },
    { id: 'INV-002', date: '2026-02-01', amount: 99.00, status: 'paid' },
    { id: 'INV-003', date: '2026-01-01', amount: 99.00, status: 'paid' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Plan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{billingInfo?.plan || 'Professional'}</p>
            <p className="text-sm text-slate-400">
              ${billingInfo?.price || 99}/{billingInfo?.billingCycle === 'yearly' ? 'year' : 'month'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={onChangePlan}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Change Plan
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="h-4 w-4" />
          <span>Next billing: {billingInfo?.nextBillingDate || 'April 1, 2026'}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white">
                {billingInfo?.paymentMethod?.brand || 'Visa'} ending in {billingInfo?.paymentMethod?.last4 || '4242'}
              </p>
              <p className="text-xs text-slate-500">Expires {billingInfo?.paymentMethod?.expiry || '12/28'}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={onUpdatePayment}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Update
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">{invoice.id}</p>
                  <p className="text-xs text-slate-500">{invoice.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-white">${invoice.amount.toFixed(2)}</span>
                <span className={"text-xs px-2 py-1 rounded-full " + (invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
                  {invoice.status}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadInvoice(invoice.id)}
                  disabled={loading}
                  className="text-slate-400 hover:text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default BillingSection;
