'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { Scissors, Plus, Clock, DollarSign, Star, Loader2, Tag, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function ServicesPage() {
  const [category, setCategory] = useState<string>('all');

  const { data: services, isLoading, error: servicesError } = useQuery({
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

  const totalRevenue = servicesList.reduce((sum: number, s: any) => sum + (s?.revenue || 0), 0);
  const totalBookings = servicesList.reduce((sum: number, s: any) => sum + (s?.bookings || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Service catalog, pricing, and performance"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Services' }]}
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-gold-400 transition-colors">
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        }
      />

      {/* Error Banner */}
      {servicesError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Unable to load services data</p>
            <p className="text-xs text-red-400/70">The backend API may be unavailable. Showing empty state.</p>
          </div>
        </div>
      )}

      {/* Service Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
            <div className="rounded-lg bg-gold-500/10 p-2">
              <Tag className="h-5 w-5 text-gold-400" />
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
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <Tag className="h-4 w-4 text-slate-500" />
        <button
          onClick={() => setCategory('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${category === 'all' ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          All
        </button>
        {categoriesList.map((cat: string, i: number) => (
          <button
            key={i}
            onClick={() => setCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${category === cat ? 'bg-gold-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service: any, i: number) => (
            <div key={service?.id || i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{service?.name || 'Unnamed Service'}</h3>
                  <p className="text-sm text-slate-500">{service?.category || 'Uncategorized'}</p>
                </div>
                <StatusBadge
                  status={service?.active || service?.is_active ? 'Active' : 'Inactive'}
                  variant={service?.active || service?.is_active ? 'success' : 'neutral'}
                />
              </div>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{service?.description || 'No description'}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="text-white font-mono">{service?.duration || 0} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Price</span>
                  <span className="text-white font-mono">${(service?.price || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Bookings</span>
                  <span className="text-white font-mono">{service?.bookings || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Revenue</span>
                  <span className="text-emerald-400 font-mono">${(service?.revenue || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-400">{service?.staffCount || 0} staff assigned</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No services found"
          description={category !== 'all' ? 'No services in this category' : 'Add your first service to get started'}
          icon={<Scissors className="h-12 w-12" />}
        />
      )}
    </div>
  );
}
