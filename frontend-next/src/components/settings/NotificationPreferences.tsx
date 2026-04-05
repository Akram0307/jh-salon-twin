'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Bell, Mail, MessageSquare, Calendar, AlertTriangle } from 'lucide-react';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  marketingEmails: boolean;
  lowInventoryAlerts: boolean;
  staffUpdates: boolean;
  revenueReports: boolean;
  clientFeedback: boolean;
}

interface NotificationPreferencesProps {
  initialSettings?: NotificationSettings;
  onSave?: (settings: NotificationSettings) => void;
}

export function NotificationPreferences({ initialSettings, onSave }: NotificationPreferencesProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings || {
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    marketingEmails: false,
    lowInventoryAlerts: true,
    staffUpdates: true,
    revenueReports: true,
    clientFeedback: true,
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (onSave) {
        await onSave(settings);
      }
    } finally {
      setLoading(false);
    }
  };

  const notificationItems = [
    {
      key: 'emailNotifications' as keyof NotificationSettings,
      label: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: <Mail className="h-5 w-5 text-slate-400" />,
    },
    {
      key: 'smsNotifications' as keyof NotificationSettings,
      label: 'SMS Notifications',
      description: 'Receive notifications via text message',
      icon: <MessageSquare className="h-5 w-5 text-slate-400" />,
    },
    {
      key: 'appointmentReminders' as keyof NotificationSettings,
      label: 'Appointment Reminders',
      description: 'Get reminders for upcoming appointments',
      icon: <Calendar className="h-5 w-5 text-slate-400" />,
    },
    {
      key: 'marketingEmails' as keyof NotificationSettings,
      label: 'Marketing Emails',
      description: 'Receive promotional offers and updates',
      icon: <Bell className="h-5 w-5 text-slate-400" />,
    },
    {
      key: 'lowInventoryAlerts' as keyof NotificationSettings,
      label: 'Low Inventory Alerts',
      description: 'Get notified when products are running low',
      icon: <AlertTriangle className="h-5 w-5 text-slate-400" />,
    },
    {
      key: 'staffUpdates' as keyof NotificationSettings,
      label: 'Staff Updates',
      description: 'Receive updates about staff schedules and performance',
      icon: <Bell className="h-5 w-5 text-slate-400" />,
    },
    {
      key: 'revenueReports' as keyof NotificationSettings,
      label: 'Revenue Reports',
      description: 'Get daily/weekly revenue summaries',
      icon: <Bell className="h-5 w-5 text-slate-400" />,
    },
    {
      key: 'clientFeedback' as keyof NotificationSettings,
      label: 'Client Feedback',
      description: 'Receive notifications for new client reviews',
      icon: <Bell className="h-5 w-5 text-slate-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
        <div className="space-y-4">
          {notificationItems.slice(0, 2).map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
              <div className="flex items-center gap-3">
                {item.icon}
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
                className="data-[state=checked]:bg-gold-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Types</h3>
        <div className="space-y-4">
          {notificationItems.slice(2).map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
              <div className="flex items-center gap-3">
                {item.icon}
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
                className="data-[state=checked]:bg-gold-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="bg-gold-500 text-slate-950 hover:bg-gold-400"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
export default NotificationPreferences;
