import React, { useEffect, useState } from "react";

import { apiFetch } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2, Wallet, Award } from 'lucide-react';
import { glass, semantic, component } from '../../lib/design-tokens';

interface Membership {
  id: string;
  name: string;
  status: string;
  expiry: string;
}

interface WalletData {
  points: number;
  balance: number;
  memberships: Membership[];
}

export default function MembershipWallet() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiFetch<WalletData>('/api/client/wallet');
        setData(response || { points: 0, balance: 0, memberships: [] });
      } catch (err) {
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-6">Membership & Wallet</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass.subtle semantic.border.default">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{data?.points || 0}</div></CardContent>
          </Card>

          <Card className="glass.subtle semantic.border.default">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${(data?.balance || 0).toFixed(2)}</div></CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Active Memberships</h2>
          {data?.memberships && data.memberships.length > 0 ? (
            <div className="space-y-2">
              {data.memberships.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-4 glass.subtle rounded-xl border border-white/5">
                  <span>{m.name}</span>
                  <span className="text-sm text-zinc-400">Expires: {m.expiry}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">No active memberships found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
