import { useEffect, useMemo, useState } from "react";
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''

export default function PosCheckout({items,total,onComplete}:any){
  const [tip,setTip] = useState(0)
  const [method,setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [showAmountModal, setShowAmountModal] = useState(false)
  const [editableTotal, setEditableTotal] = useState(total || 0)
  const safeItems = useMemo(() => Array.isArray(items) ? items : [], [items])
  const finalTotal = Number(editableTotal || 0) + tip

  // Payment methods with icons and colors
  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: '💵', color: 'oklch(0.723 0.219 149)' },
    { id: 'phonepe', label: 'PhonePe', icon: '📱', color: 'oklch(0.623 0.214 259)' },
    { id: 'card', label: 'Card', icon: '💳', color: 'oklch(0.554 0.017 247)' },
    { id: 'upi', label: 'UPI', icon: '📲', color: 'oklch(0.769 0.188 70)' },
  ]

  const isDigitalPayment = method === 'phonepe' || method === 'upi'

  const pay = async()=>{
    try {
      await axios.post(`${API_BASE}/api/pos/complete-transaction`,{
        items: safeItems,
        total: finalTotal,
        method,
        reference: isDigitalPayment ? reference : undefined,
        tip,
        timestamp: new Date().toISOString()
      })
      onComplete()
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    }
  }

  // Pre-fill amount with service total
  useEffect(() => {
    setEditableTotal(total || 0)
  }, [total])

  return (
    <div style={{ 
      position:'fixed', 
      bottom:0, 
      left:0, 
      right:0, 
      background:'oklch(0.984 0.003 247)', 
      borderTopLeftRadius:20, 
      borderTopRightRadius:20, 
      padding:20, 
      boxShadow:'0 -10px 40px rgba(0,0,0,0.25)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{fontWeight:700,fontSize:18,marginBottom:10,color:'oklch(0.208 0.011 247)'}}>Payment</div>

      {/* Amount Entry Section */}
      <div style={{marginBottom:15}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{color:'oklch(0.446 0.017 247)'}}>Amount</span>
          <button 
            onClick={() => setShowAmountModal(true)}
            style={{
              background:'none',
              border:'none',
              color:'oklch(0.546 0.245 262)',
              cursor:'pointer',
              fontSize:14
            }}
          >
            Edit
          </button>
        </div>
        <div style={{fontSize:24,fontWeight:700,color:'oklch(0.208 0.011 247)'}}>
          ₹{editableTotal.toFixed(2)}
        </div>
      </div>

      {/* Tip Options */}
      <div style={{display:'flex',gap:10,marginBottom:15}}>
        {[0,50,100].map(t=> (
          <button 
            key={t} 
            onClick={()=>setTip(t)} 
            style={{ 
              flex:1, 
              padding:10, 
              borderRadius:10, 
              border: tip === t ? '2px solid oklch(0.723 0.219 149)' : '1px solid oklch(0.929 0.009 247)',
              background: tip === t ? 'oklch(0.968 0.005 247)' : 'white',
              cursor:'pointer',
              fontWeight: tip === t ? 600 : 400
            }}
          >
            {t === 0 ? 'No Tip' : `₹${t}`}
          </button>
        ))}
      </div>

      {/* Payment Method Selector */}
      <div style={{display:'flex',gap:10,marginBottom:15,flexWrap:'wrap'}}>
        {paymentMethods.map(m=>(
          <button 
            key={m.id} 
            onClick={()=>setMethod(m.id)} 
            style={{ 
              flex:1, 
              minWidth: '45%',
              padding:12, 
              borderRadius:12, 
              border: method===m.id ? `2px solid ${m.color}` : '1px solid oklch(0.929 0.009 247)',
              background: method===m.id ? 'oklch(0.968 0.005 247)' : 'white',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              gap:4,
              cursor:'pointer'
            }}
          >
            <span style={{fontSize:20}}>{m.icon}</span>
            <span style={{fontWeight: method===m.id ? 600 : 400}}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Reference/UTR Field for Digital Payments */}
      {isDigitalPayment && (
        <div style={{marginBottom:15}}>
          <label style={{display:'block',marginBottom:6,color:'oklch(0.446 0.017 247)',fontSize:14}}>
            {method === 'phonepe' ? 'PhonePe Reference ID' : 'UPI Transaction ID'}
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Enter reference/UTR number"
            style={{
              width:'100%',
              padding:12,
              borderRadius:10,
              border:'1px solid oklch(0.929 0.009 247)',
              fontSize:16
            }}
          />
        </div>
      )}

      {/* Total Summary */}
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:15,padding:'12px 0',borderTop:'1px solid oklch(0.929 0.009 247)',borderBottom:'1px solid oklch(0.929 0.009 247)'}}>
        <span style={{fontWeight:600}}>Total</span>
        <b style={{fontSize:18}}>₹{finalTotal.toFixed(2)}</b>
      </div>

      {/* Pay Button */}
      <button 
        onClick={pay} 
        style={{ 
          width:'100%', 
          padding:16, 
          borderRadius:14, 
          border:'none', 
          background:'oklch(0.723 0.219 149)', 
          color:'white', 
          fontSize:18, 
          fontWeight:700,
          cursor:'pointer'
        }}
      >
        Pay ₹{finalTotal.toFixed(2)}
      </button>

      {/* Amount Edit Modal */}
      {showAmountModal && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:1000
        }}>
          <div style={{
            background:'white',
            padding:24,
            borderRadius:16,
            width:'90%',
            maxWidth:400
          }}>
            <h3 style={{margin:'0 0 16px 0'}}>Edit Amount</h3>
            <input
              type="number"
              value={editableTotal}
              onChange={(e) => setEditableTotal(parseFloat(e.target.value) || 0)}
              style={{
                width:'100%',
                padding:12,
                borderRadius:10,
                border:'1px solid oklch(0.929 0.009 247)',
                fontSize:18,
                marginBottom:16
              }}
            />
            <div style={{display:'flex',gap:10}}>
              <button
                onClick={() => setShowAmountModal(false)}
                style={{
                  flex:1,
                  padding:12,
                  borderRadius:10,
                  border:'1px solid oklch(0.929 0.009 247)',
                  background:'white',
                  cursor:'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAmountModal(false)}
                style={{
                  flex:1,
                  padding:12,
                  borderRadius:10,
                  border:'none',
                  background:'oklch(0.723 0.219 149)',
                  color:'white',
                  cursor:'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
