import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../core/api/client';
import { Loader2, ArrowLeft, Star, Calendar } from 'lucide-react';
import { glass, semantic, component } from '../../lib/design-tokens';

interface Stylist {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
}

export default function StylistProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    apiFetch<Stylist>(`/api/stylists/${id}`)
      .then((data: Stylist) => {
        setStylist(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!stylist) {
    return <div className="p-4 text-center">Stylist not found.</div>;
  }

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-4 text-white">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center rounded-full px-3 py-2 text-sm transition hover:glass.default"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </button>

      <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg">
        <div className="space-y-4 p-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-3xl">
            {stylist.name[0]}
          </div>
          <h1 className="text-center text-3xl font-bold">{stylist.name}</h1>
          <p className="text-center text-zinc-400">{stylist.specialty}</p>
          <div className="flex items-center justify-center gap-1 text-yellow-500">
            <Star className="fill-current" /> {stylist.rating}
          </div>
          <p className="pt-4 text-zinc-300">{stylist.bio}</p>

          <button
            type="button"
            className="flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-black transition hover:bg-zinc-200"
            onClick={() => navigate(`/client/booking?stylistId=${stylist.id}`)}
          >
            <Calendar className="mr-2 h-4 w-4" /> Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
