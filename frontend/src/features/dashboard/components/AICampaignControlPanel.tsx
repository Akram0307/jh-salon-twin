import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../core/api/client';
import { asArray } from '../../../core/api/utils';

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'paused';
  messages_sent: number;
  conversions: number;
  revenue_recovered: number;
};

export default function AICampaignControlPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const data = await apiFetch<any>('/api/ai/campaigns');
      setCampaigns(asArray<Campaign>(data));
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/ai/campaigns/${id}/${status === 'active' ? 'pause' : 'resume'}`, { method: 'POST' });
      fetchCampaigns();
    } catch {
      // endpoint may be unavailable in current backend
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const safeCampaigns = useMemo(() => asArray<Campaign>(campaigns), [campaigns]);

  if (loading) {
    return <div className="bg-white rounded-xl shadow p-4"><h2 className="text-lg font-semibold mb-2">AI Campaign Control</h2><p className="text-gray-500 text-sm">Loading campaigns...</p></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-4">AI Campaign Control</h2>
      {safeCampaigns.length === 0 && <p className="text-gray-500 text-sm">No active AI campaigns</p>}
      <div className="space-y-3">
        {safeCampaigns.map((c) => (
          <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500 mt-1">{c.messages_sent} messages • {c.conversions} conversions • ${c.revenue_recovered}</div>
            </div>
            <button onClick={() => toggleCampaign(c.id, c.status)} className={`px-3 py-1 rounded text-sm ${c.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {c.status === 'active' ? 'Pause' : 'Resume'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
