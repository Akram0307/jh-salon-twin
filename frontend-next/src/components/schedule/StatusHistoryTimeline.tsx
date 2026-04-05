'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentStatusBadge, STATUS_CONFIG } from './AppointmentStatusBadge';
import { 
  Clock, 
  User, 
  MessageSquare,
  History
} from 'lucide-react';

interface StatusHistoryEntry {
  id: string;
  appointment_id: string;
  old_status: string;
  new_status: string;
  changed_by_staff_id?: string;
  changed_by_name?: string;
  reason?: string;
  created_at: string;
}

interface StatusHistoryTimelineProps {
  appointmentId: string;
  salonId: string;
  limit?: number;
}

export function StatusHistoryTimeline({
  appointmentId,
  salonId,
  limit = 10
}: StatusHistoryTimelineProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/appointments/${appointmentId}/status-history?salon_id=${salonId}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch status history');
        }

        const data = await response.json();
        setHistory(data || []);
      } catch (err) {
        console.error('Error fetching status history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [appointmentId, salonId, limit]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5 text-gold-400" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-slate-800" />
                  <Skeleton className="h-3 w-1/2 bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5 text-gold-400" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-500">
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <History className="h-5 w-5 text-gold-400" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No status changes yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative pl-8 pb-4">
                  {/* Timeline line */}
                  {index !== history.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-px bg-slate-700" />
                  )}

                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1">
                    <div className="h-6 w-6 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                      <Clock className="h-3 w-3 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.old_status && (
                        <>
                          <AppointmentStatusBadge 
                            status={entry.old_status as keyof typeof STATUS_CONFIG} 
                            size="sm" 
                          />
                          <span className="text-slate-500 text-xs">→</span>
                        </>
                      )}
                      <AppointmentStatusBadge 
                        status={entry.new_status as keyof typeof STATUS_CONFIG} 
                        size="sm" 
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="h-3 w-3" />
                      <span>{entry.changed_by_name || 'System'}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(entry.created_at)}</span>
                    </div>

                    {entry.reason && (
                      <div className="flex items-start gap-2 mt-1">
                        <MessageSquare className="h-3 w-3 text-slate-500 mt-0.5" />
                        <p className="text-xs text-slate-300">{entry.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
