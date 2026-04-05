'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { tokens } from '@/lib/design-tokens';
import { User, Mail, Phone, Calendar, DollarSign, Star, Clock, Scissors, Save, X } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  segment?: 'vip' | 'regular' | 'new' | 'at-risk';
  totalSpent?: number;
  visitCount?: number;
  lastVisit?: string;
  nextAppointment?: string;
  notes?: string;
}

interface ClientDetailModalProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onSave?: (client: Client) => void;
}

export function ClientDetailModal({ client, open, onClose, onSave }: ClientDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Client | null>(client);

  if (!client) return null;

  const getSegmentBadge = (segment?: string) => {
    switch (segment) {
      case 'vip':
        return <Badge className="bg-gold-500/20 text-gold-400 border-gold-500/30"><Star className="h-3 w-3 mr-1" />VIP</Badge>;
      case 'at-risk':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">At Risk</Badge>;
      case 'new':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">New</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Regular</Badge>;
    }
  };

  const handleSave = () => {
    if (formData && onSave) {
      onSave(formData);
    }
    setEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-lg font-medium text-white">{client.name?.charAt(0) || '?'}</span>
              </div>
              <div>
                <span>{client.name}</span>
                <div className="mt-1">{getSegmentBadge(client.segment)}</div>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-xs">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-slate-500" />
                {editing ? (
                  <Input
                    value={formData?.email || ''}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="bg-slate-800 border-slate-700 text-white h-8"
                  />
                ) : (
                  <span className="text-sm text-white">{client.email || 'N/A'}</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Phone</Label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-slate-500" />
                {editing ? (
                  <Input
                    value={formData?.phone || ''}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="bg-slate-800 border-slate-700 text-white h-8"
                  />
                ) : (
                  <span className="text-sm text-white">{client.phone || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-800/50 p-3">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">Total Spent</span>
              </div>
              <p className="text-lg font-semibold text-white font-mono">${(client.totalSpent || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-3">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Scissors className="h-3 w-3" />
                <span className="text-xs">Visits</span>
              </div>
              <p className="text-lg font-semibold text-white font-mono">{client.visitCount || 0}</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-3">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Last Visit</span>
              </div>
              <p className="text-sm font-medium text-white">{client.lastVisit || 'Never'}</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-slate-400 text-xs">Notes</Label>
            {editing ? (
              <textarea
                value={formData?.notes || ''}
                onChange={(e) => setFormData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                className="w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[80px]"
                placeholder="Add notes about this client..."
              />
            ) : (
              <p className="text-sm text-slate-300 mt-1">{client.notes || 'No notes added.'}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="border-slate-700 text-slate-300">
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gold-500 text-slate-950 hover:bg-gold-400">
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
                Close
              </Button>
              <Button onClick={() => setEditing(true)} className="bg-gold-500 text-slate-950 hover:bg-gold-400">
                Edit Client
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
