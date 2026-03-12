'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { api } from '@/lib/api';
import { Settings, User, Bell, CreditCard, Shield, Palette, Globe, Clock, Loader2, Save, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'billing' | 'security' | 'appearance'>('profile');
  const [saving, setSaving] = useState(false);

  const { data: salon, isLoading: salonLoading } = useQuery({
    queryKey: ['settings', 'salon'],
    queryFn: () => api.salon.get(),
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['settings', 'user'],
    queryFn: () => api.user.get(),
  });

  const isLoading = salonLoading || userLoading;

  const handleSave = async () => {
    setSaving(true);
    // Save logic would go here
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Account, salon, and system configuration"
        breadcrumbs={[{ label: 'Owner HQ', href: '/owner/dashboard' }, { label: 'Settings' }]}
        actions={
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-gold-400 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        }
      />

      <div className="flex gap-6">
        {/* Settings Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <nav className="space-y-1">
              {([
                { id: 'profile', label: 'Salon Profile', icon: Building2 },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'billing', label: 'Billing', icon: CreditCard },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'appearance', label: 'Appearance', icon: Palette },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${activeTab === tab.id ? 'bg-gold-500/10 text-gold-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Salon Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Salon Name</label>
                    <input
                      type="text"
                      defaultValue={salon?.name || ''}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Business Type</label>
                    <select className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold-500">
                      <option>Hair Salon</option>
                      <option>Beauty Salon</option>
                      <option>Barbershop</option>
                      <option>Spa</option>
                      <option>Nail Salon</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                    <textarea
                      defaultValue={salon?.description || ''}
                      rows={3}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="tel"
                        defaultValue={salon?.phone || ''}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        defaultValue={salon?.email || ''}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <textarea
                        defaultValue={salon?.address || ''}
                        rows={2}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Business Hours</h3>
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                      <span className="text-sm text-white">{day}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          defaultValue="09:00"
                          className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-500"
                        />
                        <span className="text-slate-500">to</span>
                        <input
                          type="time"
                          defaultValue="18:00"
                          className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-500"
                        />
                        <button className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 transition-colors">
                          Closed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'notifications' ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { id: 'appointments', label: 'Appointment Reminders', description: 'Get notified about upcoming appointments' },
                  { id: 'cancellations', label: 'Cancellations', description: 'Alert when clients cancel appointments' },
                  { id: 'payments', label: 'Payment Notifications', description: 'Receive payment confirmations and alerts' },
                  { id: 'reviews', label: 'New Reviews', description: 'Get notified when clients leave reviews' },
                  { id: 'marketing', label: 'Marketing Updates', description: 'Receive tips and platform updates' },
                ].map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">{pref.label}</p>
                      <p className="text-xs text-slate-500">{pref.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'billing' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Current Plan</h3>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Professional Plan</p>
                      <p className="text-sm text-slate-400">$49/month • Billed monthly</p>
                    </div>
                    <StatusBadge status="Active" variant="success" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">∞</p>
                        <p className="text-xs text-slate-500">Staff Members</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">∞</p>
                        <p className="text-xs text-slate-500">Appointments</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">24/7</p>
                        <p className="text-xs text-slate-500">Support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-8 w-8 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-white">•••• •••• •••• 4242</p>
                        <p className="text-xs text-slate-500">Expires 12/25</p>
                      </div>
                    </div>
                    <button className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 transition-colors">
                      Update
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="px-4 py-3 text-sm text-slate-400">Mar 1, 2026</td>
                        <td className="px-4 py-3 text-sm text-white">Professional Plan - Monthly</td>
                        <td className="px-4 py-3 text-sm font-mono text-white">$49.00</td>
                        <td className="px-4 py-3"><StatusBadge status="Paid" variant="success" /></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-slate-400">Feb 1, 2026</td>
                        <td className="px-4 py-3 text-sm text-white">Professional Plan - Monthly</td>
                        <td className="px-4 py-3 text-sm font-mono text-white">$49.00</td>
                        <td className="px-4 py-3"><StatusBadge status="Paid" variant="success" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'security' ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Account Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Password</p>
                      <p className="text-xs text-slate-500">Last changed 30 days ago</p>
                    </div>
                    <button className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 transition-colors">
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Add an extra layer of security</p>
                    </div>
                    <button className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs text-slate-950 hover:bg-gold-400 transition-colors">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Active Sessions</p>
                      <p className="text-xs text-slate-500">Manage your logged-in devices</p>
                    </div>
                    <button className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <h3 className="text-lg font-semibold text-white mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Export Data</p>
                      <p className="text-xs text-slate-500">Download all your salon data</p>
                    </div>
                    <button className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 transition-colors">
                      Export
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Delete Account</p>
                      <p className="text-xs text-slate-500">Permanently delete your account and data</p>
                    </div>
                    <button className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Theme</p>
                    <p className="text-xs text-slate-500">Choose your preferred color scheme</p>
                  </div>
                  <select className="rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-500">
                    <option>Dark (Default)</option>
                    <option>Light</option>
                    <option>System</option>
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Accent Color</p>
                    <p className="text-xs text-slate-500">Customize your interface accent</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="h-6 w-6 rounded-full bg-gold-500 border-2 border-white"></button>
                    <button className="h-6 w-6 rounded-full bg-blue-500 border-2 border-transparent"></button>
                    <button className="h-6 w-6 rounded-full bg-emerald-500 border-2 border-transparent"></button>
                    <button className="h-6 w-6 rounded-full bg-purple-500 border-2 border-transparent"></button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                  <div>
                    <p className="text-sm font-medium text-white">Compact Mode</p>
                    <p className="text-xs text-slate-500">Reduce spacing for more content</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
