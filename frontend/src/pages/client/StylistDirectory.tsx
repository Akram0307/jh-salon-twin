import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../core/api/client';
import { Loader2, User, Users, MessageCircle, Phone } from 'lucide-react';
import { glass, semantic, component } from '../../lib/design-tokens';

interface Stylist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
}

export default function StylistDirectory() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<Stylist[]>('/api/stylists')
      .then((data: Stylist[]) => {
        setStylists(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-4 text-white">
      <h1 className="text-2xl font-bold">Our Stylists</h1>
      {stylists.length === 0 ? (
        <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full glass.subtle p-4">
              <Users className="h-8 w-8 text-white/40" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No stylists available</h2>
          <p className="text-white/60 text-sm mb-6">Our team is currently offline. Let us help you find the perfect match.</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/client/chat')}
              className="flex items-center justify-center gap-2 glass.default hover:bg-white/20 text-white rounded-[16px] px-4 py-3 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Chat with AI Receptionist
            </button>
            <a
              href="tel:+15551234567"
              className="flex items-center justify-center gap-2 border semantic.border.default hover:glass.subtle text-white/80 rounded-[16px] px-4 py-3 transition"
            >
              <Phone className="h-4 w-4" />
              Call Salon Directly
            </a>
            <button
              type="button"
              onClick={() => navigate('/client/services')}
              className="border semantic.border.default hover:glass.subtle text-white/80 rounded-[16px] px-4 py-3 transition"
            >
              View Services
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg"
            >
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                    <User className="text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{stylist.name}</h2>
                    <p className="text-sm text-zinc-400">{stylist.specialty}</p>
                    <p className="text-xs text-zinc-500">Rating: {stylist.rating.toFixed(1)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border semantic.border.strong px-4 py-2 text-sm transition hover:glass.default"
                  onClick={() => navigate(`/client/stylist/${stylist.id}`)}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
