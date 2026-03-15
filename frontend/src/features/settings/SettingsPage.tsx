import { useEffect,useState } from 'react'

export default function SettingsPage(){
  const [salon,setSalon]=useState(null)

  useEffect(()=>{
    fetch('/api/salon')
      .then(r=>r.json())
      .then(setSalon)
  },[])

  return (
    <div>
      <h2>Salon Settings</h2>
      <pre>{JSON.stringify(salon,null,2)}</pre>
    </div>
  )
}
