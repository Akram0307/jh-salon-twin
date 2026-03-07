import { useEffect,useState } from 'react'

export default function ServicesManager(){
  const [services,setServices]=useState([])

  useEffect(()=>{
    fetch('/api/services')
      .then(r=>r.json())
      .then(setServices)
  },[])

  return (
    <div>
      <h2>Services</h2>
      {services.map((s:any)=> (
        <div key={s.id}>{s.name} - {s.price}</div>
      ))}
    </div>
  )
}
