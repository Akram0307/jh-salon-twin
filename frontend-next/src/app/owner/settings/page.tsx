'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import ProfileForm from '@/components/settings/ProfileForm';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import SecuritySettings from '@/components/settings/SecuritySettings';
import BillingSection from '@/components/settings/BillingSection';
import { ScrollableTabs } from '@/components/shared/responsive/ScrollableTabs';
import { api } from '@/lib/api';
import { Settings, User, Bell, Shield, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'billing';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: () => api.settings.getProfile(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: () => api.settings.getNotifications(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ['settings', 'billing'],
    queryFn: () => api.settings.getBilling(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  const isLoading = profileLoading || notificationsLoading || billingLoading;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and billing"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Settings' }]}
      />

      {/* Error Banner */}
      {profileError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Unable to load settings data</p>
            <p className="text-xs text-red-400/70">The backend API may be unavailable. Showing default settings.</p>
          </div>
        </div>
      )}

      {/* Mobile: Scrollable Tabs */}
      <div className="lg:hidden">
        <ScrollableTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as SettingsTab)}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <nav className="space-y-1 rounded-xl border border-slate-800 bg-slate-900/50 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gold-500/10 text-gold-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 rounded-xl border border-slate-800 bg-slate-900/50">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2 sm:mb-4">Profile Settings</h2>
                  <p className="text-sm text-slate-400 mb-4 sm:mb-6">Update your personal information and profile photo.</p>
                  <ProfileForm
                    initialData={profile || {
                      name: 'Salon Owner',
                      email: 'owner@salon.com',
                      phone: '',
                      address: ''
                    }}
                    onSave={(data) => console.log('Profile saved:', data)}
                  />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2 sm:mb-4">Notification Preferences</h2>
                  <p className="text-sm text-slate-400 mb-4 sm:mb-6">Control how and when you receive notifications.</p>
                  <NotificationPreferences
                    initialSettings={notifications || {
                      emailNotifications: true,
                      smsNotifications: true,
                      appointmentReminders: true,
                      marketingEmails: false,
                      lowInventoryAlerts: true,
                      staffUpdates: true,
                      revenueReports: true,
                      clientFeedback: true
                    }}
                    onSave={(data) => console.log('Notifications saved:', data)}
                  />
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2 sm:mb-4">Security Settings</h2>
                  <p className="text-sm text-slate-400 mb-4 sm:mb-6">Manage your password, two-factor authentication, and sessions.</p>
                  <SecuritySettings
                    onChangePassword={(currentPassword: string, newPassword: string) => console.log('Password changed:', { currentPassword, newPassword })}
                    onEnable2FA={() => console.log('2FA enabled')}
                  />
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2 sm:mb-4">Billing & Subscription</h2>
                  <p className="text-sm text-slate-400 mb-4 sm:mb-6">Manage your subscription plan and payment methods.</p>
                  <BillingSection
                    billingInfo={billing || {
                      plan: 'Professional',
                      price: 79,
                      billingCycle: 'monthly',
                      nextBillingDate: '2026-04-14',
                      paymentMethod: {
                        type: 'card',
                        brand: 'Visa',
                        last4: '4242',
                        expiry: '12/28'
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
