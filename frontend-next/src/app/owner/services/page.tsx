'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import ServiceDialog from '@/components/services/ServiceDialog';
import CategoryManagement from '@/components/services/CategoryManagement';
import ServicePerformanceSparklines from '@/components/services/ServicePerformanceSparklines';
import ServiceMobileCard from '@/components/services/ServiceMobileCard';
import { ResponsiveStatGrid, HorizontalFilterChips } from '@/components/shared/responsive';
import { api } from '@/lib/api';
import { Scissors, Clock, DollarSign, Star, Loader2, Tag, Users, TrendingUp, AlertCircle, Settings, Trash2, Download, ToggleLeft } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
    confirmationTitle: 'Delete Services',
    confirmationMessage: 'Are you sure you want to delete the selected services? This action cannot be undone.',
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
// Services Page Content
// ============================================

function ServicesPageContent({ servicesList, categoriesList, isLoading, refetch, category, setCategory, showCategoryManagement, setShowCategoryManagement }: any) {
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

  const handleSelectAll = () => {
    if (selectedIds.size === servicesList.length) {
      clearSelection();
    } else {
      selectAll(servicesList.map((service: any) => service.id));
    }
  };

  const totalRevenue = servicesList.reduce((sum: number, s: any) => sum + (s?.revenue || 0), 0);
  const totalBookings = servicesList.reduce((sum: number, s: any) => sum + (s?.bookings || 0), 0);

  // Build filter chips for HorizontalFilterChips
  const filterChips = useMemo(() => [
    {
      id: 'all',
      label: 'All',
      active: category === 'all',
      onClick: () => setCategory('all'),
    },
    ...categoriesList.map((cat: string, i: number) => ({
      id: `cat-${i}`,
      label: cat,
      active: category === cat,
      onClick: () => setCategory(cat),
    })),
  ], [category, categoriesList]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 pb-24">
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Services"
          description="Service catalog, pricing, and performance"
          breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Services' }]}
          actions={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setShowCategoryManagement(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Manage Categories</span>
                <span className="sm:hidden">Categories</span>
              </button>
              <ServiceDialog onServiceSaved={() => refetch()} />
            </div>
          }
        />

        {/* Error Banner */}
        {/* Note: We don't have servicesError in this component, so we'll remove it or pass it as prop */}
        {/* For now, we'll remove it and handle errors in the parent */}

        {/* Service Stats - Using ResponsiveStatGrid */}
        <ResponsiveStatGrid>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Scissors className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Services</p>
                <p className="text-xl font-bold text-white font-mono">{servicesList.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Revenue</p>
                <p className="text-xl font-bold text-white font-mono">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Tag className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Categories</p>
                <p className="text-xl font-bold text-white font-mono">{categoriesList.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Bookings</p>
                <p className="text-xl font-bold text-white font-mono">{totalBookings}</p>
              </div>
            </div>
          </div>
        </ResponsiveStatGrid>

        {/* Category Filter - Using HorizontalFilterChips */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-400">Filter by Category</span>
          </div>
          <HorizontalFilterChips chips={filterChips} />
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : servicesList.length > 0 ? (
          <>
            {/* Mobile Card List - visible on small screens */}
            <div className="space-y-3 lg:hidden">
              {servicesList.map((service: any, i: number) => (
                <div key={service?.id || i} className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={isSelected(service.id)}
                      onCheckedChange={() => toggleSelection(service.id)}
                      aria-label={`Select ${service.name}`}
                    />
                  </div>
                  <ServiceMobileCard
                    key={service?.id || i}
                    service={service}
                    onServiceSaved={() => refetch()}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Grid - hidden on small screens */}
            <div className="hidden lg:block rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-12">
                        <Checkbox
                          checked={servicesList.length > 0 && selectedIds.size === servicesList.length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Bookings</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {servicesList.map((service: any, i: number) => (
                      <tr key={service?.id || i} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected(service.id)}
                            onCheckedChange={() => toggleSelection(service.id)}
                            aria-label={`Select ${service.name}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                              <Scissors className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{service?.name || 'Unnamed Service'}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{service?.description || 'No description'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-400">{service?.category || 'Uncategorized'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white font-mono">{service?.duration || 0} min</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white font-mono">${(service?.price || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white font-mono">{service?.bookings || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-emerald-400 font-mono">${(service?.revenue || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={service?.active || service?.is_active ? 'Active' : 'Inactive'}
                            variant={service?.active || service?.is_active ? 'success' : 'neutral'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <ServiceDialog service={service} onServiceSaved={() => refetch()} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="No services found"
            description={category !== 'all' ? 'No services in this category' : 'Add your first service to get started'}
            icon={<Scissors className="h-12 w-12" />}
          />
        )}

        {/* Category Management Modal */}
        {showCategoryManagement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => setShowCategoryManagement(false)} />
            <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Category Management</h2>
                <button
                  onClick={() => setShowCategoryManagement(false)}
                  className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CategoryManagement />
            </div>
          </div>
        )}
      </div>
      
      {/* Bulk Action Bar */}
      <BulkActionBar entityName="services" />
    </div>
  );
}

// ============================================
// Services Page with Provider
// ============================================

export default function ServicesPage() {
  const [category, setCategory] = useState<string>('all');
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const { toast } = useToast();

  const { data: services, isLoading, error: servicesError, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.services.list(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: categories, error: categoriesError } = useQuery({
    queryKey: ['services', 'categories'],
    queryFn: () => api.services.getCategories(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const servicesList = Array.isArray(services) ? services : [];
  const categoriesList = Array.isArray(categories) ? categories : [];

  const filteredServices = servicesList.filter((service: any) => {
    if (category === 'all') return true;
    return service?.category === category;
  });

  const handleBulkAction = useCallback(async (actionId: string, selectedIds: string[]) => {
    try {
      switch (actionId) {
        case 'delete':
          await api.services.bulkDelete(selectedIds);
          toast({
            title: 'Services deleted',
            description: `${selectedIds.length} services have been deleted.`,
          });
          break;
        case 'export':
          const servicesToExport = servicesList.filter((s: any) => selectedIds.includes(s.id));
          const csvContent = [
            ['Name', 'Category', 'Duration', 'Price', 'Bookings', 'Revenue', 'Status'].join(','),
            ...servicesToExport.map((s: any) => [
              s.name,
              s.category || 'Uncategorized',
              s.duration || 0,
              s.price || 0,
              s.bookings || 0,
              s.revenue || 0,
              s.active || s.is_active ? 'Active' : 'Inactive'
            ].join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'services_export.csv';
          a.click();
          window.URL.revokeObjectURL(url);
          
          toast({
            title: 'Export complete',
            description: `${selectedIds.length} services exported to CSV.`,
          });
          break;
        case 'tag':
          toast({
            title: 'Tag services',
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
  }, [servicesList, refetch, toast]);

  return (
    <BulkOperationsProvider onAction={handleBulkAction}>
      <ServicesPageContent 
        servicesList={filteredServices}
        categoriesList={categoriesList}
        isLoading={isLoading}
        refetch={refetch}
        category={category}
        setCategory={setCategory}
        showCategoryManagement={showCategoryManagement}
        setShowCategoryManagement={setShowCategoryManagement}
      />
    </BulkOperationsProvider>
  );
}
