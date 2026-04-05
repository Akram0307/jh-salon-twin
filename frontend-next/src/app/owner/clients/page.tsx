'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import AddClientDialog from '@/components/clients/AddClientDialog';
import { api } from '@/lib/api';
import { Users, Search, Mail, Phone, Calendar, DollarSign, Star, Loader2, Filter, Trash2, Download, Tag, ToggleLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ResponsiveStatGrid } from '@/components/shared/responsive/ResponsiveStatGrid';
import { MobileDataCardList } from '@/components/shared/responsive/MobileDataCardList';
import { HorizontalFilterChips } from '@/components/shared/responsive/HorizontalFilterChips';
import { ClientMobileCard } from '@/components/clients/ClientMobileCard';
import { BulkOperationsProvider, useBulkOperations } from '@/contexts/BulkOperationsContext';
import { BulkActionBar } from '@/components/shared/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

// ============================================
// Bulk Actions Configuration
// ============================================

const bulkActions = [
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'danger' as const,
    requiresConfirmation: true,
    confirmationTitle: 'Delete Clients',
    confirmationMessage: 'Are you sure you want to delete the selected clients? This action cannot be undone.',
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    variant: 'outline' as const,
  },
  {
    id: 'tag',
    label: 'Tag',
    icon: <Tag className="h-4 w-4" />,
    variant: 'outline' as const,
  },
  {
    id: 'status',
    label: 'Change Status',
    icon: <ToggleLeft className="h-4 w-4" />,
    variant: 'outline' as const,
  },
];

// ============================================
// Clients Page Content
// ============================================

function ClientsPageContent({ clients, isLoading, refetch, filteredClients }: any) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'new' | 'at-risk'>('all');
  
  const {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    setActions,
  } = useBulkOperations();

  // Set bulk actions when component mounts
  useEffect(() => {
    setActions(bulkActions);
  }, [setActions]);

  const filterChips = [
    { id: 'all', label: 'All', active: filter === 'all', onClick: () => setFilter('all') },
    { id: 'vip', label: 'VIP', active: filter === 'vip', onClick: () => setFilter('vip') },
    { id: 'new', label: 'New', active: filter === 'new', onClick: () => setFilter('new') },
    { id: 'at-risk', label: 'At Risk', active: filter === 'at-risk', onClick: () => setFilter('at-risk') },
  ];

  const handleSelectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      clearSelection();
    } else {
      selectAll(filteredClients.map((client: any) => client.id));
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <PageHeader
          title="Clients"
          description="Client relationship management and CRM"
          breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Clients' }]}
          actions={<AddClientDialog onClientAdded={() => refetch()} />}
        />

        {/* Search & Filters */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            <div className="flex items-center gap-2 sm:hidden">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-500">Filters</span>
            </div>
          </div>
          
          {/* Filter chips */}
          <div className="mt-3">
            <HorizontalFilterChips chips={filterChips} />
          </div>
        </div>

        {/* Client Stats */}
        <ResponsiveStatGrid>
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
        </ResponsiveStatGrid>

        {/* Desktop Table */}
        <div className="hidden lg:block rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-12">
                    <Checkbox
                      checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
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
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client: any, i: number) => (
                    <tr key={client.id || i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected(client.id)}
                          onCheckedChange={() => toggleSelection(client.id)}
                          aria-label={`Select ${client.name}`}
                        />
                      </td>
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
                    <td colSpan={7} className="px-4 py-12">
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

        {/* Mobile Cards */}
        <MobileDataCardList>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : filteredClients.length > 0 ? (
            filteredClients.map((client: any, i: number) => (
              <div key={client.id || i} className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={isSelected(client.id)}
                    onCheckedChange={() => toggleSelection(client.id)}
                    aria-label={`Select ${client.name}`}
                  />
                </div>
                <ClientMobileCard
                  client={client}
                  onViewProfile={() => {
                    console.log('View profile for:', client.name);
                  }}
                />
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <EmptyState
                title="No clients found"
                description={search ? 'Try adjusting your search terms' : 'Add your first client to get started'}
                icon={<Users className="h-12 w-12" />}
              />
            </div>
          )}
        </MobileDataCardList>
      </div>
      
      <BulkActionBar entityName="clients" />
    </div>
  );
}

// ============================================
// Clients Page with Provider
// ============================================

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'new' | 'at-risk'>('all');
  const { toast } = useToast();

  const { data: clients, isLoading, refetch } = useQuery({
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

  const handleBulkAction = useCallback(async (actionId: string, selectedIds: string[]) => {
    try {
      switch (actionId) {
        case 'delete':
          await api.clients.bulkDelete(selectedIds);
          toast({
            title: 'Clients deleted',
            description: `${selectedIds.length} clients have been deleted.`,
          });
          break;
        case 'export':
          const clientsToExport = filteredClients.filter((c: any) => selectedIds.includes(c.id));
          const csvContent = [
            ['Name', 'Email', 'Phone', 'Last Visit', 'Total Spent', 'Segment'].join(','),
            ...clientsToExport.map((c: any) => [
              c.name,
              c.email,
              c.phone,
              c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'Never',
              c.totalSpent || 0,
              c.segment || 'Regular'
            ].join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'clients_export.csv';
          a.click();
          window.URL.revokeObjectURL(url);
          
          toast({
            title: 'Export complete',
            description: `${selectedIds.length} clients exported to CSV.`,
          });
          break;
        case 'tag':
          toast({
            title: 'Tag clients',
            description: 'Tag functionality coming soon.',
          });
          break;
        case 'status':
          toast({
            title: 'Change status',
            description: 'Status change functionality coming soon.',
          });
          break;
      }
      refetch();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast({
        title: 'Action failed',
        description: 'An error occurred while performing the bulk action.',
        variant: 'destructive',
      });
    }
  }, [filteredClients, refetch, toast]);

  return (
    <BulkOperationsProvider onAction={handleBulkAction}>
      <ClientsPageContent 
        clients={clients}
        isLoading={isLoading}
        refetch={refetch}
        filteredClients={filteredClients}
      />
    </BulkOperationsProvider>
  );
}
