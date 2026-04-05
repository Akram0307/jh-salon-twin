import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { asArray } from '../../../core/api/utils'

interface Service {
  id: string
  name: string
  price: number
  category?: string
}

interface Product {
  id: string
  name: string
  price: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''

export default function PosServiceSelection({ onCheckout }: any) {
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [recent, setRecent] = useState<Service[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    axios.get(`${API_BASE}/api/services`).then(r => setServices(asArray<Service>(r.data))).catch(() => setServices([]))
    axios.get(`${API_BASE}/api/clients`).then(r => setClients(asArray<any>(r.data))).catch(() => setClients([]))
    axios.get(`${API_BASE}/api/products`).then(r => setProducts(asArray<Product>(r.data))).catch(() => setProducts([]))

    const r = localStorage.getItem('recent_services')
    if (r) {
      try {
        setRecent(asArray<Service>(JSON.parse(r)))
      } catch {
        setRecent([])
      }
    }
  }, [])

  const safeServices = useMemo(() => asArray<Service>(services), [services])
  const safeProducts = useMemo(() => asArray<Product>(products), [products])
  const safeRecent = useMemo(() => asArray<Service>(recent), [recent])
  const safeClients = useMemo(() => asArray<any>(clients), [clients])
  const safeCart = useMemo(() => asArray<any>(cart), [cart])

  const addService = (s: Service) => {
    const updated = [...safeCart, s]
    setCart(updated)

    const rec = [s, ...safeRecent.filter(x => x.id !== s.id)].slice(0, 5)
    setRecent(rec)
    localStorage.setItem('recent_services', JSON.stringify(rec))
  }

  const addProduct = (p: Product) => {
    setCart([...safeCart, p])
  }

  const removeItem = (index: number) => {
    const updated = [...safeCart]
    updated.splice(index, 1)
    setCart(updated)
  }

  const total = safeCart.reduce((t: number, i: any) => t + Number(i?.price || 0), 0)

  return (
    <div style={{ paddingBottom: 160 }}>
      {safeRecent.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700 }}>Recent Services</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
            {safeRecent.map(s => (
              <button
                key={s.id}
                onClick={() => addService(s)}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', whiteSpace: 'nowrap' }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700 }}>Attach Client</div>
        <select value={client ?? ''} onChange={(e) => setClient(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10 }}>
          <option value="">Select client</option>
          {safeClients.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name || c.full_name || 'Client'}</option>
          ))}
        </select>
      </div>

      {safeCart.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700 }}>Cart</div>
          {safeCart.map((i, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>{i?.name || 'Item'}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <span>${Number(i?.price || 0)}</span>
                <button onClick={() => removeItem(idx)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {safeServices.map(s => (
          <button
            key={s.id}
            onClick={() => addService(s)}
            style={{ padding: 20, borderRadius: 12, border: '1px solid #ddd', textAlign: 'left' }}
          >
            <div style={{ fontWeight: 700 }}>{s.name}</div>
            <div>${Number(s.price || 0)}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        <div style={{ fontWeight: 700 }}>Retail Upsells</div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
          {safeProducts.map(p => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd' }}
            >
              {p.name} ${Number(p.price || 0)}
            </button>
          ))}
        </div>
      </div>

      {safeCart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', color: '#fff', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>${total}</div>
          <button
            onClick={() => onCheckout(safeCart, total, client)}
            style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#22c55e', color: '#fff' }}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
