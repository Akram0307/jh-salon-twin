import { useMemo, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''

export default function PosCheckout({items,total,onComplete}:any){
  const [tip,setTip] = useState(0)
  const [method,setMethod] = useState('card')
  const safeItems = useMemo(() => Array.isArray(items) ? items : [], [items])
  const finalTotal = Number(total || 0) + tip

  const pay = async()=>{
    await axios.post(`${API_BASE}/api/pos/complete-transaction`,{
      items: safeItems,
      total: finalTotal,
      method
    })

    onComplete()
  }

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, boxShadow:'0 -10px 40px rgba(0,0,0,0.25)' }}>
      <div style={{fontWeight:700,fontSize:18,marginBottom:10}}>Payment</div>

      <div style={{display:'flex',gap:10,marginBottom:15}}>
        {[0.1,0.15,0.2].map(t=> (
          <button key={t} onClick={()=>setTip(Math.round(Number(total || 0)*t))} style={{ flex:1, padding:10, borderRadius:10, border:'1px solid #ddd' }}>
            {t*100}% Tip
          </button>
        ))}
      </div>

      <div style={{display:'flex',gap:10,marginBottom:15}}>
        {['card','cash'].map(m=>(
          <button key={m} onClick={()=>setMethod(m)} style={{ flex:1, padding:12, borderRadius:12, border:method===m?'2px solid #22c55e':'1px solid #ddd' }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:15}}>
        <span>Total</span>
        <b>${finalTotal}</b>
      </div>

      <button onClick={pay} style={{ width:'100%', padding:16, borderRadius:14, border:'none', background:'#22c55e', color:'#fff', fontSize:18, fontWeight:700 }}>
        Pay Now
      </button>
    </div>
  )
}
