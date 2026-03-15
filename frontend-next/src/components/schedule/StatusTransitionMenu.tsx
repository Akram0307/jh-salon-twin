'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AppointmentStatusBadge, STATUS_CONFIG } from './AppointmentStatusBadge';
import { 
  ChevronDown, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface StatusTransitionMenuProps {
  currentStatus: keyof typeof STATUS_CONFIG;
  appointmentId: string;
  salonId: string;
  staffId?: string;
  onStatusChange?: (newStatus: string) => void;
  disabled?: boolean;
  variant?: 'dropdown' | 'buttons';
}

export function StatusTransitionMenu({
  currentStatus,
  appointmentId,
  salonId,
  staffId,
  onStatusChange,
  disabled = false,
  variant = 'dropdown'
}: StatusTransitionMenuProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof STATUS_CONFIG | null>(null);
  const [reason, setReason] = useState('');

  const currentConfig = STATUS_CONFIG[currentStatus];
  const availableStatuses = currentConfig.nextStatuses;

  // Handle status transition
  const handleStatusTransition = async (newStatus: keyof typeof STATUS_CONFIG) => {
    // Check if this is an irreversible transition (e.g., to COMPLETED)
    const isIrreversible = newStatus === 'COMPLETED';

    if (isIrreversible) {
      setSelectedStatus(newStatus);
      setConfirmDialogOpen(true);
      return;
    }

    await updateStatus(newStatus);
  };

  // Update status via API
  const updateStatus = async (newStatus: string, changeReason?: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          status: newStatus,
          staff_id: staffId,
          reason: changeReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      toast({
        title: 'Status Updated',
        description: `Appointment status changed to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`
      });

      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
      setReason('');
    }
  };

  // Handle confirmation dialog
  const handleConfirm = () => {
    if (selectedStatus) {
      updateStatus(selectedStatus, reason);
    }
  };

  // Render dropdown variant
  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="border-slate-700 text-slate-300"
              disabled={disabled || loading || availableStatuses.length === 0}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>
                  <AppointmentStatusBadge status={currentStatus} size="sm" />
                  {availableStatuses.length > 0 && (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700 w-48">
            {availableStatuses.map((status) => {
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusTransition(status as keyof typeof STATUS_CONFIG)}
                  className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {config.label}
                </DropdownMenuItem>
              );
            })}
            {availableStatuses.length === 0 && (
              <DropdownMenuItem disabled className="text-slate-500">
                No available transitions
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                Confirm Status Change
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-slate-300">
                You are about to change the appointment status to{' '}
                <span className="font-semibold text-white">
                  {selectedStatus && STATUS_CONFIG[selectedStatus]?.label}
                </span>.
                This action cannot be undone.
              </p>
              <div>
                <Label className="text-slate-400 text-xs">Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                  placeholder="Add a reason for this status change..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmDialogOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                className="bg-gold-500 text-slate-950 hover:bg-gold-400"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Confirm Change'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Render buttons variant
  return (
    <div className="flex flex-wrap gap-2">
      {availableStatuses.map((status) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
        const Icon = config.icon;
        return (
          <Button
            key={status}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => handleStatusTransition(status as keyof typeof STATUS_CONFIG)}
            disabled={disabled || loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Icon className="h-4 w-4 mr-1" />
            )}
            {config.label}
          </Button>
        );
      })}
    </div>
  );
}

// Bulk Status Update Component
interface BulkStatusUpdateProps {
  appointmentIds: string[];
  salonId: string;
  staffId?: string;
  currentStatus?: keyof typeof STATUS_CONFIG;
  onBulkUpdate?: () => void;
}

export function BulkStatusUpdate({
  appointmentIds,
  salonId,
  staffId,
  currentStatus,
  onBulkUpdate
}: BulkStatusUpdateProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get available statuses for bulk update
  const getAvailableStatuses = () => {
    if (!currentStatus) return [];
    return STATUS_CONFIG[currentStatus]?.nextStatuses || [];
  };

  const handleBulkUpdate = async () => {
    if (!selectedStatus || appointmentIds.length === 0) return;

    try {
      setLoading(true);

      const response = await fetch('/api/appointments/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          appointment_ids: appointmentIds,
          status: selectedStatus,
          staff_id: staffId,
          reason: reason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update appointments');
      }

      const result = await response.json();

      toast({
        title: 'Bulk Update Successful',
        description: `Updated ${result.updated_count} appointments to ${STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]?.label}`
      });

      setDialogOpen(false);
      setSelectedStatus('');
      setReason('');

      if (onBulkUpdate) {
        onBulkUpdate();
      }
    } catch (error) {
      console.error('Error bulk updating appointments:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update appointments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (appointmentIds.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        className="border-slate-700 text-slate-300"
        onClick={() => setDialogOpen(true)}
        disabled={getAvailableStatuses().length === 0}
      >
        <Users className="h-4 w-4 mr-2" />
        Bulk Update ({appointmentIds.length})
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Bulk Status Update
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-slate-400 text-xs">Update {appointmentIds.length} appointments to:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {getAvailableStatuses().map((status) => {
                    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                    return (
                      <SelectItem 
                        key={status} 
                        value={status} 
                        className="text-white hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-400 text-xs">Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Add a reason for this bulk update..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              className="bg-gold-500 text-slate-950 hover:bg-gold-400"
              disabled={loading || !selectedStatus}
            >
              {loading ? 'Updating...' : `Update ${appointmentIds.length} Appointments`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
