'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { Users, Search, Plus, Mail, Phone, Calendar, DollarSign, Star, Loader2, Filter } from 'lucide-react';
import { useState } from 'react';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'new' | 'at-risk'>('all');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search, filter],
    queryFn: () => api.clients.list({ search, filter }),
  });

  const filteredClients = clients?.filter((client: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        client.name?.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.phone?.includes(search)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Client relationship management and CRM"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Clients' }]}
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-gold-400 transition-colors">
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        }
      />

      {/* Search & Filters */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          {(['all', 'vip', 'new', 'at-risk'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {f === 'all' ? 'All' : f === 'vip' ? 'VIP' : f === 'new' ? 'New' : 'At Risk'}
            </button>
          ))}
        </div>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Clients</p>
              <p className="text-xl font-bold text-white font-mono">{clients?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gold-500/10 p-2">
              <Star className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">VIP Clients</p>
              <p className="text-xl font-bold text-white font-mono">{clients?.filter((c: any) => c.segment === 'vip').length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">New This Month</p>
              <p className="text-xl font-bold text-white font-mono">{clients?.filter((c: any) => c.segment === 'new').length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/10 p-2">
              <DollarSign className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg. LTV</p>
              <p className="text-xl font-bold text-white font-mono">$0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Last Visit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Segment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">{client.name?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{client.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{client.totalVisits || 0} visits</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />
                          {client.email || 'No email'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Phone className="h-3 w-3" />
                          {client.phone || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-white">${(client.totalSpent || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={client.segment || 'Regular'}
                        variant={client.segment === 'vip' ? 'success' : client.segment === 'new' ? 'info' : client.segment === 'at-risk' ? 'warning' : 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <EmptyState
                      title="No clients found"
                      description={search ? 'Try adjusting your search terms' : 'Add your first client to get started'}
                      icon={<Users className="h-12 w-12" />}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
