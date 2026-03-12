import { useEffect, useState } from "react";

export default function ClientList(){
  const [clients,setClients]=useState([])

  useEffect(()=>{
    fetch('/api/clients')
      .then(r=>r.json())
      .then(setClients)
  },[])

  return (
    <div>
      <h2>Clients</h2>
      {clients.map((c:any)=> (
        <div key={c.id}>{c.name} - {c.phone}</div>
      ))}
    </div>
  )
}
