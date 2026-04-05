'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { tokens } from '@/lib/design-tokens';
import { 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  Scissors,
  ChevronLeft,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
// QRCode placeholder - qrcode.react not installed
const QRCode = ({ value, size, level }: { value: string; size?: number; level?: string }) => (
  <div style={{ width: size || 64, height: size || 64, border: '1px dashed #666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#666' }}>QR</div>
);

// Types
interface Appointment {
  id: string;
  client_name: string;
  client_phone?: string;
  service_name: string;
  staff_name: string;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

interface PrintableScheduleProps {
  salonId: string;
  staffId?: string;
}

// Status color mapping
const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-500/20 text-blue-300',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-300',
  ARRIVED: 'bg-amber-500/20 text-amber-300',
  IN_PROGRESS: 'bg-purple-500/20 text-purple-300',
  COMPLETED: 'bg-slate-500/20 text-slate-300'
};

// Format time for display
function formatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Format date for display
function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Get date range for view
function getDateRange(view: 'day' | 'week' | 'month', date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (view) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function PrintableSchedule({ salonId, staffId }: PrintableScheduleProps) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string | undefined>(staffId);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const { start, end } = getDateRange(view, currentDate);

        const params = new URLSearchParams({
          salon_id: salonId,
          start_date: start.toISOString(),
          end_date: end.toISOString()
        });

        if (selectedStaff) {
          params.append('staff_id', selectedStaff);
        }

        const response = await fetch(`/api/appointments?${params}`);
        if (!response.ok) throw new Error('Failed to fetch appointments');

        const data = await response.json();
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load appointments',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [salonId, selectedStaff, view, currentDate, toast]);

  // Handle print
  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Please allow popups to print',
        variant: 'destructive'
      });
      return;
    }

    const printContent = printRef.current.innerHTML;
    const printStyles = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          color: #000;
          background: #fff;
        }
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }
        .appointment-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          page-break-inside: avoid;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .time-slot {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .client-info {
          margin: 8px 0;
        }
        .qr-code {
          margin-top: 10px;
          text-align: center;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Schedule - ${formatDate(currentDate)}</title>
          ${printStyles}
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  // Group appointments by staff
  const groupedByStaff = appointments.reduce((acc, appointment) => {
    const staff = appointment.staff_name;
    if (!acc[staff]) acc[staff] = [];
    acc[staff].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Sort appointments by time
  Object.keys(groupedByStaff).forEach(staff => {
    groupedByStaff[staff].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  });

  return (
    <div className="space-y-4">
      {/* Controls - hidden when printing */}
      <div className="no-print flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('prev')}
            className="border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('next')}
            className="border-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-white ml-2">
            {formatDate(currentDate)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as any)}>
            <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="day" className="text-white hover:bg-slate-700">Day</SelectItem>
              <SelectItem value="week" className="text-white hover:bg-slate-700">Week</SelectItem>
              <SelectItem value="month" className="text-white hover:bg-slate-700">Month</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handlePrint}
            className="bg-gold-500 text-slate-950 hover:bg-gold-400"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Schedule
          </Button>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef}>
        {/* Print header */}
        <div className="print-header">
          <h1 className="text-2xl font-bold">Salon Schedule</h1>
          <p className="text-lg">{formatDate(currentDate)}</p>
          <p className="text-sm text-slate-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full bg-slate-800" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <h3 className="text-lg font-medium text-slate-300">No appointments</h3>
            <p className="text-slate-500">No appointments scheduled for this period</p>
          </div>
        ) : (
          <div className="schedule-grid">
            {Object.entries(groupedByStaff).map(([staffName, staffAppointments]) => (
              <div key={staffName} className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {staffName}
                </h3>
                <div className="space-y-3">
                  {staffAppointments.map(appointment => (
                    <div 
                      key={appointment.id} 
                      className="appointment-card bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="time-slot flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                          </div>
                          <Badge className={`${STATUS_COLORS[appointment.status]} border-0 mt-1`}>
                            {appointment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="qr-code no-print">
                          <QRCode 
                            value={`salon-checkin:${appointment.id}`} 
                            size={60}
                            level="L"
                          />
                        </div>
                      </div>

                      <div className="client-info">
                        <div className="font-medium">{appointment.client_name}</div>
                        {appointment.client_phone && (
                          <div className="text-sm text-gray-600">{appointment.client_phone}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                        <Scissors className="h-4 w-4" />
                        <span>{appointment.service_name}</span>
                      </div>

                      {appointment.notes && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          Note: {appointment.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
