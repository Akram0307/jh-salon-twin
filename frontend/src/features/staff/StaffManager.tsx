import { useEffect, useState } from 'react'

export default function StaffManager(){
  const [staff,setStaff]=useState([])

  useEffect(()=>{
    fetch('/api/staff')
      .then(r=>r.json())
      .then(setStaff)
  },[])

  return (
    <div>
      <h2>Staff Manager</h2>
      {staff.map((s:any)=> (
        <div key={s.id}>{s.name}</div>
      ))}
    </div>
  )
}
