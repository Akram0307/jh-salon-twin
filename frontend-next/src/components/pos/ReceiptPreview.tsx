'use client';

import { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem } from '@/types/pos';

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId?: string;
}

export function ReceiptPreview({ isOpen, onClose, transactionId }: ReceiptPreviewProps) {
  const { items, client, staff, paymentMethod, tip, subtotal, total } = useCartStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .items { margin-bottom: 20px; }
                .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .totals { border-top: 1px dashed #000; padding-top: 10px; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="receipt">
                ${receiptRef.current.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      const receiptContent = receiptRef.current.innerText;
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionId || 'draft'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Receipt Preview</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div ref={receiptRef} className="space-y-4 p-4 border rounded-lg bg-white text-black">
            <div className="text-center border-b pb-4">
              <h2 className="text-xl font-bold">SalonOS</h2>
              <p className="text-sm text-gray-600">Transaction Receipt</p>
              {transactionId && (
                <p className="text-xs text-gray-500 mt-1">ID: {transactionId}</p>
              )}
            </div>

            {client && (
              <div className="border-b pb-2">
                <p className="text-sm font-medium">Client</p>
                <p className="text-sm">{client.name || client.full_name || 'Guest'}</p>
              </div>
            )}

            {staff && (
              <div className="border-b pb-2">
                <p className="text-sm font-medium">Staff</p>
                <p className="text-sm">{staff.name}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-medium">Items</p>
              {items.map((item: CartItem) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity || 1}</span>
                  <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tip</span>
                <span>${tip.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment Method</span>
                <span className="capitalize">{paymentMethod}</span>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              <p>Thank you for your business!</p>
              <p>Powered by SalonOS</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
