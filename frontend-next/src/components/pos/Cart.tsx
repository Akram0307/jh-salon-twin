'use client';

import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import type { CartItem } from '@/types/pos';

interface CartProps {
  onCheckout?: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const { items, removeItem, updateQuantity, subtotal, total, tip } = useCartStore();

  if (items.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center p-8">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Your cart is empty</h3>
        <p className="text-muted-foreground mt-2">
          Add services or products to get started
        </p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Cart</span>
          <Badge variant="neutral">{items.length} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-4">
          {items.map((item: CartItem) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="neutral" className="text-xs">
                    {item.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ${item.price.toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <div className="p-4 border-t space-y-3">
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
        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Proceed to Checkout
        </Button>
      </div>
    </Card>
  );
}
